// Gets data from submited form
const setup = () => {
    
    // Prevent form submit
    event.preventDefault();

    // Get values from form
    let formData = {
        credit: Number(event.target.credit.value),
        time: Number(event.target.time.value),
        interest: Number(event.target.interest.value)
    }

    // Validate input
    if(validateData(formData)){
        // Calculate monthly interest
        let monthlyInterest = formData.interest / 12 / 100;

        // Calculates annuity coefficient
        let annuityCoef = calcAnnuityCoef(monthlyInterest, formData.time);

        // Calculate monthly payment
        let monthlyPayment = annuityCoef * formData.credit;
        
        generatePaymentGraph(formData.credit, monthlyInterest, monthlyPayment, formData.time);
    }else{
        // Add message
        console.log('Bad input');

        // Clear tableContainer if table exists
        if(tableContainer.hasChildNodes()){
            // Clears table container if table is present
            tableContainer.innerHTML = '';
        }
    }
}

// Generates payment graph
const generatePaymentGraph = (credit, monthlyInterest, monthlyPayment, months) => {
    // Placeholder array for monthly payment data
    let paymentArray = [];
    let payment;

    // Fill paymentArray
    for(let i = 0; i < months; i++){
        // Check if first payment
        if(i === 0){
            payment = calcMonth(i, credit, monthlyInterest, monthlyPayment);
        // If not first payment, send previous payment remaining credit
        }else{
            payment = calcMonth(i, paymentArray[i-1].remainingCredit, monthlyInterest, monthlyPayment);
        }
        // Push data to paymentArray
        paymentArray.push(payment);
    }

    // Generate payment table
    // Selects table container
    let tableContainer = document.getElementById('tableContainer');
    
    // Check if table exists in tableContainer
    if(tableContainer.hasChildNodes()){
        // Clears table container if table is present
        tableContainer.innerHTML = '';
    }

    // Creates a new table element
    let table = document.createElement('table');
    // Appends table to tableContainer
    tableContainer.appendChild(table);

    // Generates table data
    for(let i = 0; i < paymentArray.length; i++){
        // Creates table row
        let tableRow = document.createElement('tr');

        // Creates a single row
        for(let key in paymentArray[i]){
            // Creates table cell
            let tableCell = document.createElement('td');
            // Creates text data to cell
            let text = document.createTextNode(paymentArray[i][key]);
            // Appends text data to cell
            tableCell.appendChild(text);
            // Appends cell to row
            tableRow.appendChild(tableCell);
        }        
        // Appends row to table
        table.appendChild(tableRow);
    }
}

// UTILS
// Calculates monthly annuity coefficient
const calcAnnuityCoef = (monthlyInterest, months) => {
    return (monthlyInterest * (Math.pow((1 + monthlyInterest), months))) / ((Math.pow((1 + monthlyInterest), months) - 1));
}

// Calculates single month payment data
const calcMonth = (i, creditLeft, monthlyInterest, monthlyPayment) => {
    // Calculate remaining credit sum
    let remainingCredit = i === 0 ?
        creditLeft :
        creditLeft - (monthlyPayment - creditLeft * monthlyInterest)

    // Calculate interest payment
    let monthlyInterestPayment = remainingCredit * monthlyInterest;

    // Calculate principal payment
    let monthlyCreditPayment = monthlyPayment - monthlyInterestPayment;
    
    return {
        id: i + 1,
        remainingCredit,
        monthlyCreditPayment,
        monthlyInterestPayment,
        totalMonthlyPayment: monthlyCreditPayment + monthlyInterestPayment
    }
}

// Form input validation
const validateData = (formData) => {
    // Check if any input is less than 1
    for(let key in formData){
        if(formData[key] < 1){
            return false
        }
    }
    return true;
}

const precisionRound = (number, precision) => {
    let factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}