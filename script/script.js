// Gets data from submited form
const setup = () => {
    
    // Prevent form from submitting
    event.preventDefault();

    // Get values from form
    let formData = {
        credit: Number(event.target.credit.value),
        creditLength: Number(event.target.paymentPeriods.value),
        paymentPeriods: Number(event.target.paymentPeriods.value),
        interest: Number(event.target.interest.value),
        paymentDate: new Date(event.target.date.value)
    }

    // Validate input
    if(validateData(formData)){
        let paymentGraph = new PaymentGraph(formData.credit, formData.creditLength, formData.paymentPeriods, formData.interest, formData.paymentDate);
    }else{
        
        // Clear tableContainer if table exists
        if(tableContainer.hasChildNodes()){
            // Clears table container if table is present
            tableContainer.innerHTML = '';
        }
    
        // Add error message
        tableContainer.innerHTML = "<h2>All values must be greater than zero.</h2>";
    }
}

class PaymentGraph {
    
    constructor(credit, creditLength, paymentPeriods, interest, paymentDate){
        
        this.credit = credit; /* Total credit sum */
        this.creditLength = creditLength;
        this.paymentPeriods = paymentPeriods; /* Credit paymentPeriods in months */
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
        let annuityCoef = (this.monthlyInterest * (Math.pow((1 + this.monthlyInterest), this.paymentPeriods))) / ((Math.pow((1 + this.monthlyInterest), this.paymentPeriods) - 1));
        annuityCoef = String(annuityCoef).slice(0,8);
        annuityCoef = Number(annuityCoef);
        
        return annuityCoef;
    }

    // Generates data for paymentArray
    createPaymentArray(){

            // Fill paymentArray
            for(let i = 0; i < this.paymentPeriods; i++){
                let payment;

                // Check if adding first payment
                if(i === 0){
                    payment = this.calcMonth(i, this.credit, this.paymentDate);
                // If not first payment, send previous payments remaining credit
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

        // Check if interest is not equal to zero or less
        newInterestRate < 1
            ? newInterestRate = 1
            : newInterestRate = newInterestRate

        // Checks if newInterestRate is equal to previous payment newInterestRate. If they are equal calculations for all payments should be redone as they calculate based of remaining credit
        if(id !== 0 && newInterestRate === this.paymentArray[id - 1].interest){
            this.updatePaymentArray(0, 0);

        }else{
            // Update interest rate
            this.interest = newInterestRate;
    
            // Set credit to remaining credit from interest rate update moment for calculations
            this.credit = this.paymentArray[id].remainingCredit;
            
            // Calculates remaining paymentPeriods
            this.paymentPeriods = this.paymentPeriods - id;
    
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
    
            // Reset paymentPeriods to full
            this.paymentPeriods = this.paymentArray.length;
    
            this.createPaymentTable(id);
        }
    }

    // Calculates single month data
    calcMonth(i, creditLeft, date){
      
        // Calculate remaining credit sum
        let remainingCredit = Number(
                i === 0
                    ? creditLeft
                    : (creditLeft - this.paymentArray[i-1].monthlyCreditPayment)
        )
        
        // Calculate interest payment
        let monthlyInterestPayment = (remainingCredit * this.monthlyInterest);
    
        // Calculate principal payment
        let monthlyCreditPayment = (this.monthlyPayment - monthlyInterestPayment);

        // Checks if last credit payment is enough for remaining credit. If not, then last payment = remaining credit
        if(i === this.creditLength - 1 && monthlyCreditPayment < remainingCredit){
            monthlyCreditPayment = remainingCredit;
        }
       
        // Update payment day
        let paymentDate = new Date(date);
        let paymentDateString;

        if(i === 0){
            paymentDateString = paymentDate.toLocaleDateString();
        }else{
            paymentDate.setMonth(paymentDate.getMonth() + 1);
            paymentDateString = paymentDate.toLocaleDateString();
        }

        return {
            id: i + 1,
            paymentDate: paymentDateString,
            remainingCredit: remainingCredit.toFixed(2),
            monthlyCreditPayment: monthlyCreditPayment.toFixed(2),
            monthlyInterestPayment: monthlyInterestPayment.toFixed(2),
            totalMonthlyPayment: (monthlyCreditPayment + monthlyInterestPayment).toFixed(2),
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
            increaseButton.classList.add('tableAddButton','tableButton');
            tableRow.appendChild(increaseButton);

            let decreaseButton = document.createElement('td');
            decreaseButton.appendChild(document.createTextNode('-'));
            decreaseButton.addEventListener('click', () => {
                this.updatePaymentArray(i, -1);
            });
            decreaseButton.classList.add('tableRemoveButton','tableButton');
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