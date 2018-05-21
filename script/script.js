// Gets data from submited form
const setup = () => {
    
    // Prevent form from submit
    event.preventDefault();

    // Get values from form
    let formData = {
        credit: Number(event.target.credit.value),
        time: Number(event.target.time.value),
        interest: Number(event.target.interest.value),
        paymentDate: new Date(event.target.date.value)
    }

    // Validate input
    if(validateData(formData)){
        let paymentGraph = new PaymentGraph(formData.credit, formData.time, formData.interest, formData.paymentDate);
    }else{
        // Add error message
        console.log('Bad input');

        // Clear tableContainer if table exists
        if(tableContainer.hasChildNodes()){
            // Clears table container if table is present
            tableContainer.innerHTML = '';
        }
    }
}

class PaymentGraph {
    
    constructor(credit, time, interest, paymentDate){
        
        this.credit = credit; /* Total credit sum */
        this.time = time; /* Credit time in months */
        this.interest = interest; /* Anual interest rate */
        this.paymentDate = paymentDate /* Date of first payment */

        this.tableHeader = ["Payment #", "Payment date", "Remaining amount", "Principal payment", "Interest payment", "Total payment", "Interest rate"];

        // Placeholder array for monthly payment data
        this.paymentArray = [];

        // Calculates interest value for one month
        this.monthlyInterest = this.interest / 12 / 100;

        // Calculates annuity coefficient
        this.annuityCoef = this.calcAnnuityCoef();

        // Calculates a single monthly payment
        this.monthlyPayment = this.annuityCoef * credit;

        this.createPaymentArray();
    }
    
    // Calculates monthly annuity coefficient
    calcAnnuityCoef(){
        return (this.monthlyInterest * (Math.pow((1 + this.monthlyInterest), this.time))) / ((Math.pow((1 + this.monthlyInterest), this.time) - 1));
    }

    // Generates data for paymentArray
    createPaymentArray(){

            // Fill paymentArray
            for(let i = 0; i < this.time; i++){
                let payment;

                // Check if adding first payment
                if(i === 0){
                    payment = this.calcMonth(i, this.credit, this.paymentDate);
                // If not first payment, send previous payment remaining credit
                }else{
                    payment = this.calcMonth(i, this.paymentArray[i-1].remainingCredit, this.paymentArray[i-1].paymentDate);
                }
                
                // Push data to paymentArray
                this.paymentArray.push(payment);
            }

        this.createPaymentTable();
    }

    // Updates paymentArray
    updatePaymentArray(id, interestChange){
        
        let newInterestRate = this.paymentArray[id].interest + interestChange;

        // Checks if newInterestRate is equal to previous payment newInterestRate. If they are equal calculations for all payments should be redone as they calculate based of remaining credit
        if(id !== 0 && newInterestRate === this.paymentArray[id - 1].interest){
            this.updatePaymentArray(0, 0);

        }else{

            this.interest = newInterestRate;
    
            // Set credit to remaining credit from interest rate update moment for calculations
            this.credit = this.paymentArray[id].remainingCredit;
            
            // Calculates remaining time
            this.time = this.time - id;
    
            // Calculates interest value for one month
            this.monthlyInterest = newInterestRate / 12 / 100;
    
            // Calculates annuity coefficient
            this.annuityCoef = this.calcAnnuityCoef();
    
            // Calculates a single monthly payment
            this.monthlyPayment = this.annuityCoef * this.credit;
    
            for(let i = id; i < this.paymentArray.length; i++){
                if(i === 0){
                    this.paymentArray[i] = this.calcMonth(i, this.credit, this.paymentDate);
                }else{
                    this.paymentArray[i] = this.calcMonth(i, this.paymentArray[i-1].remainingCredit, this.paymentArray[i-1].paymentDate);
                }
            }
    
            // Reset time to full
            this.time = this.paymentArray.length;
    
            this.createPaymentTable(id);
        }
    }

    // Calculates single month data
    calcMonth(i, creditLeft, date){
      
        // Calculate remaining credit sum
        let remainingCredit = 
            i === 0
                ? creditLeft
                : creditLeft - (this.monthlyPayment - creditLeft * this.monthlyInterest)
    
        // Calculate interest payment
        let monthlyInterestPayment = remainingCredit * this.monthlyInterest;
    
        // Calculate principal payment
        let monthlyCreditPayment = this.monthlyPayment - monthlyInterestPayment;
        
        // Update payment day
        let paymentDate = new Date(date);
        let paymentString;

        if(i === 0){
            paymentString = paymentDate.toLocaleDateString();
        }else{
            paymentDate.setMonth(paymentDate.getMonth() + 1);
            paymentString = paymentDate.toLocaleDateString();
        }

        return {
            id: i + 1,
            paymentDate: paymentString,
            remainingCredit,
            monthlyCreditPayment,
            monthlyInterestPayment,
            totalMonthlyPayment: monthlyCreditPayment + monthlyInterestPayment,
            interest: this.interest
        }
    }

    // Generates payments table
    createPaymentTable(){
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

        // Generates table header
        let tableRow = document.createElement('tr');
        
        for(let i = 0; i < this.tableHeader.length; i++){
            let tableCell = document.createElement('td');
            // Creates text data to cell
            let text = document.createTextNode(this.tableHeader[i]);
            // Appends text data to cell
            tableCell.appendChild(text);

            // Appends cell to row
            tableRow.appendChild(tableCell);
        }
        // Appends row with table header to table
        table.appendChild(tableRow);

        // Generates table data
        for(let i = 0; i < this.paymentArray.length; i++){
            // Creates table row
            let tableRow = document.createElement('tr');
            // Set row to index in paymentArray. Used for updating interest rate
            tableRow.id = i;

            // Creates a single row
            for(let key in this.paymentArray[i]){
                // Creates table cell
                let tableCell = document.createElement('td');
                // Creates text data to cell
                let text = document.createTextNode(this.paymentArray[i][key]);
                // Appends text data to cell
                tableCell.appendChild(text);
                
                // Appends cell to row
                tableRow.appendChild(tableCell);
            }        
            
            // Interest rate modification buttons
            let increaseButton = document.createElement('td');
            increaseButton.appendChild(document.createTextNode('+'));    
            increaseButton.addEventListener('click', () => {
                this.updatePaymentArray(i, 1);
            });      
            tableRow.appendChild(increaseButton);

            let decreaseButton = document.createElement('td');
            decreaseButton.appendChild(document.createTextNode('-'));
            decreaseButton.addEventListener('click', () => {
                this.updatePaymentArray(i, -1);
            });  
            tableRow.appendChild(decreaseButton);

            // Appends row with payment data to table
            table.appendChild(tableRow);
        }

        // Generates CSV download button
        let buttonCSV = document.createElement('button');
        
        buttonCSV.addEventListener('click', () => {
            this.downloadCSV();
        });

        buttonCSV.innerHTML = 'Download CSV';
        buttonCSV.classList.add('downloadBtn');

        tableContainer.appendChild(buttonCSV);
    }

    createCSV(){      
        // Converts payment object data to CSV string
        let paymentArrayCSV = this.paymentArray.map((item) => {
            
            // Placeholder for a single payment CSV string
            let itemData = '';

            for(let key in item){+
                itemData.length === 0
                    ? itemData = item[key]
                    : itemData = itemData + ', ' + item[key]
            }

            return itemData;
        });

        // Placeholder for final CSV string with header row
        let finalCSV = this.tableHeader.join();

        // Converts CSV payment array to single CSV string
        for(let i = 0; i < paymentArrayCSV.length; i++){
            finalCSV = finalCSV + '\n' + paymentArrayCSV[i];
        }

        return finalCSV;
    }

    downloadCSV(){
        // Get CSV data from paymentsArray
        let csv = this.createCSV();

        // Set data header
        csv = 'data:text/csv;charset=utf-8,' + csv;

        // Creates a temp anchor tag
        let link = document.createElement('a');

        // "Embeds CSV data to href attribute"
        link.setAttribute('href', csv);

        // Sets download file name and force download
        link.setAttribute('download', 'paymentGraph.csv');

        // Triggers download
        link.click();
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
