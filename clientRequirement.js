import { LightningElement, wire, api,track} from "lwc";
import clientRequirementData from '@salesforce/apex/ClientRequirementController.getRequirements';
import sendEmailMethod from '@salesforce/apex/ClientRequirementController.sendEmailMethod';
import clientRequirementDataCall from '@salesforce/apex/ClientRequirementController.clientRequirementDataCall';
import createTaskOnCall from '@salesforce/apex/ClientRequirementController.createTaskOnCall';
import getPropertyList from '@salesforce/apex/ClientRequirementController.getPropertyList';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { removeObjectNamepace,addObjectNamepace } from "c/propertifyUtils";


export default class clientRequirement extends LightningElement {

    @api recordId;
    @api objectApiName;
    perPageValue = '10';
    selectedFinalData = [];
    selectedLogCall = [];
    showLogCall = false;
    commentValue = '';
    get options() {
        return [
            { label: '10', value: '10' },
            { label: '20', value: '20' },
            { label: '30', value: '30' },
        ];
    }
    @track selectedEmail = [];
    @track selectedEmailCC = [];
    clientData = [];
    commonList = [];
    recordURL;
    @track currentPage = 1;
    showModal = false;
    emailModal = false;
    callModal = false;
    showCC = false;
    logCallComment = '';
    propData ;

    get property_Exist(){
        console.log('objAPI: ', this.objectApiName);
        console.log('objAPI234: ', this.objectApiName === "Propertify__Propertify__Property__c" ? true : false);
        return this.objectApiName === "Propertify__Property__c" ? true : false;
    }

    get dataExist(){
        this.next
        return this.commonList.length > 0 ? true : false;
    }

    get propName(){
        return this.propData.length > 0 ? this.propData[0].Name : '';
    }
    connectedCallback(){
        console.log('called 1');
        if(this.property_Exist){
        console.log('called 2');
            this.getRequirementData();
        }else{

        }
        getPropertyList({propId: this.recordId})
        .then((data)=>{
            this.propData = data;
        })
        .catch(error=>{

        });
    }
    getContactURL(event) {
        event.preventDefault(); 
        
        let contactId = event.currentTarget.dataset.recordUrl;
        console.log('Contact Id:', contactId);
    
        if (contactId) {
            let url = window.location.hostname;
            this.recordURL = `https://${url}/lightning/r/Contact/${contactId}/view`;
            window.open(this.recordURL, '_blank');
        } else {
            console.error('Contact Id is null or undefined.');
        }
    }

/**
 * Retrieves client requirement data based on the listing ID.
 * Invokes the clientRequirementData Apex method passing the listing ID as a parameter.
 * Updates the clientData and commonList properties with the retrieved data.
 * Logs the retrieved data and any errors encountered during the process.
 */
    getRequirementData(){
        console.log('called 3');
        clientRequirementData({ listingId: this.recordId })
        .then((data)=>{
            console.log('data: '+ JSON.stringify(data));
            if(data){
                data = removeObjectNamepace(data);
                this.clientData = data;
                this.commonList = this.clientData;
                console.log('client data: ', JSON.stringify(this.clientData));
            }else{
        console.log('called 4');
                this.clientData = [];
                this.commonList = [];

            }
        })
        .catch((error)=>{
            console.error('Error:', error.message);
            this.clientData = [];
                this.commonList = [];
        });
    }

    /**
 * Retrieves client requirement data based on the selected email IDs.
 * Invokes the clientRequirementDataCall Apex method passing the selected email IDs as a parameter.
 * Updates the selectedLogCall property with the retrieved data.
 * Logs the retrieved data and any errors encountered during the process.
 * Sets the callModal property to true after the data retrieval is completed.
 */
    getClientRequirementDataCall(){
        clientRequirementDataCall({ emailIds: this.selectedEmail})
        .then((data)=>{
            if(data){
                console.log('backendDatalogCall:', JSON.stringify(JSON.parse(data)));
                this.selectedLogCall = JSON.parse(data);
                console.log('client log a call: ', JSON.stringify(this.selectedLogCall));
            }
        })
        .catch((error)=>{
            console.error('Error at line ' + error.lineNumber + ':', error);
        })
        .finally(()=>{
            this.callModal = true;
        })
    }

    handleRecordPerPage(event){
        this.perPageValue = event.target.value;
    }

    /**
 * Handles the search functionality based on the input search key.
 * Filters the client data list based on the search key and updates the common list accordingly.
 * If the object API name is 'Property__c', it filters based on the contact name associated with each requirement.
 * If the object API name is 'Contact', it also filters based on the contact name associated with each requirement.
 * @param {Event} event - The event object representing the input change event.
 */
    handleSearch(event){
        let searchKey = event.target.value.toLowerCase();
        if(searchKey){
            if(this.objectApiName === 'Propertify__Property__c'){
                this.commonList = [];
                this.clientData.forEach((ele) => {
                    if (ele.requirement.Contact__r.Name.toLowerCase().includes(searchKey.trim())) {
                        this.commonList.push(ele);
                    }
                });
                
            }else if(this.objectApiName === 'Contact'){
                this.commonList = [];
                this.clientData.forEach((ele) => {
                    if (ele.requirement.Contact__r.Name.toLowerCase().includes(searchKey.trim())) {
                        this.commonList.push(ele);
                    }
                });
            }
            console.log('final update list: ', JSON.stringify(this.commonList));
        }else{
            this.commonList = this.objectApiName === 'Propertify__Property__c' ? this.clientData : this.clientData;
            console.log('common list: ', JSON.stringify(this.commonList));
        }
        
    }

    /**
 * Retrieves paginated items from the commonList based on the current page and perPageValue properties.
 * Calculates the startIndex and endIndex of the slice based on the currentPage and perPageValue.
 * Returns the sliced portion of items from the commonList.
 */
    get paginatedItems() {

    // Calculate startIndex and endIndex based on currentPage and perPageValue
        const startIndex = (this.currentPage - 1) * this.perPageValue;
        const endIndex = this.currentPage * this.perPageValue;

    // Return the sliced portion of items from the commonList
        return this.commonList.slice(startIndex, endIndex);
    }
    get enableButtons(){
        return this.clientData.length == 0;
    }
    get isFirstPage() {
        return this.currentPage === 1;
    }
    get isLastPage() {
        return this.currentPage === this.totalPages || this.clientData.length === 0;
    }

    get totalPages() {
        return Math.ceil(this.commonList.length / this.perPageValue);
    }

    handlePrevious() {
        if (!this.isFirstPage) {
            this.currentPage -= 1;
        }
    }

    handleNext() {
        if (!this.isLastPage) {
            this.currentPage += 1;
        }
    }
    get isEnableEmail(){
        console.log('lenght selected:' ,this.selectedEmail.length);
        return this.selectedEmail.length > 0 ? false : true;
    }

    /**
 * Handles the functionality triggered by an event.
 * Toggles the showModal property to true if it's currently false.
 * If the event target's dataset id is 'call', sets the showLogCall property to true.
 * Logs the value of showLogCall to the console.
 * @param {Event} event - The event object triggering the functionality.
 */
    handleFunctionality(event){

     // Toggle showModal to true if it's currently false
        // if(!this.showModal){
            
            this.showModal = true;
        // }
     // Check if the dataset id of the event target is 'call'
        if(event.currentTarget.dataset.id === 'call'){
            this.showLogCall = true;

     // Log the value of showLogCall to the console
            console.log('showCall log: ', this.showLogCall);
        }
            console.log('showModal showModal: ', this.showModal);

    }

    /**
 * Handles the submission of email-related functionality triggered by an event.
 * If the dataset id of the event target is 'Email', sets the emailModal property to true.
 * If the dataset id of the event target is 'Call', calls the getClientRequirementDataCall method,
 * logs the value of the callModal property to the console, and sets the showModal property to false.
 * @param {Event} event - The event object triggering the submission.
 */
    handleEmailSubmit(event){
        if(event.currentTarget.dataset.id === 'Email'){
            this.emailModal = true;
        }else if(event.currentTarget.dataset.id === 'Call'){
            this.getClientRequirementDataCall();
            console.log('email submit: ', this.callModal);
        }
        this.showModal = false;
    }
    clodeModal(){
        this.showModal = false;
        this.emailModal = false;
        this.selectedEmail = [];
        this.selectedEmailCC = [];
        this.showCC = false;
        this.logCallComment = '';
        this.showLogCall = false;
    }
    closeModal(){
        this.callModal = false;
    }

    /**
 * Handles the selection/deselection of checkboxes related to email addresses.
 * Updates the selectedEmail array based on the checkbox state.
 * If a checkbox is checked, adds its corresponding email to the selectedEmail array.
 * If a checkbox is unchecked, removes its corresponding email from the selectedEmail array.
 * Then, logs the final selected email addresses to the console.
 * If selectedEmail is not empty, filters the clientData to get the corresponding data
 * and assigns it to the selectedFinalData array.
 * @param {Event} event - The event object representing the checkbox change.
 */
    handleCheckboxEmail(event){
        try {
            if(event.currentTarget.checked){
                this.selectedEmail.push(event.currentTarget.dataset.id);
            }else{
                for(let x of this.selectedEmail){
                    this.selectedEmail.splice(this.selectedEmail.indexOf(event.currentTarget.dataset.id),1);
                }
            }
            console.log('final selected email: ', JSON.stringify(this.selectedEmail));
            if(this.selectedEmail){
                let emailToShow = [];
                //let dataValue = [];
                for(let x of this.selectedEmail){
                    for(let y of this.clientData){
                        if(x === y.requirement.Contact__r.Email){
                            emailToShow.push(y);
                            //dataValue.push(y);
                        }
                    }
                }
                this.selectedFinalData = emailToShow;

            }
        } catch (error) {
            console.log(error);
        }
      
    }
    moveBack(){
        this.showModal = true;
        this.emailModal = false;
        this.showCC = false;
        this.selectedEmail = [];
        this.selectedEmailCC = [];
        this.logCallComment = '';
        this.callModal = false;
        this.showLogCall = false;
        this.selectedFinalData = [];
    }

    handleLogCallComment(event){
        this.logCallComment = event.target.value;
    }

    /**
 * Handles the sending of email functionality.
 * Checks if the objectApiName is 'Property__c'.
 * If true, prepares data for the email and calls the sendEmailMethod Apex method.
 * Logs the preparation of data and the success of email sending.
 * Displays a success toast message if the email is sent successfully.
 * Catches any errors that occur during the process and logs them.
 * Finally, resets the email modal and clears selectedFinalData and selectedEmail arrays.
 */
    handleSendEmail(){
        if(this.objectApiName === 'Propertify__Property__c'){
            console.log('calling email method');
            let temp = [];
            for(let x of this.selectedFinalData){
                let obj = {};
                obj['location'] = x.requirement.Location_Area__c;
                obj['propType'] = x.requirement.Property_Type__c;
                obj['priceMax'] = x.requirement.Price_max__c;
                obj['conName'] = x.requirement.Contact__r.Name;
                temp.push(obj);
            }
            console.log('temp: ', JSON.stringify(temp));

            sendEmailMethod({emailId: JSON.stringify(this.selectedEmail), objectData : JSON.stringify(temp)})
            .then((data) =>{
                if(data){
                    const toastEvent = new ShowToastEvent({
                        title: 'Success',
                        message: 'Email sent successfully',
                        variant: 'success',
                    });
                    this.dispatchEvent(toastEvent);
                    console.log('email sent for prop obj');
                }
            })
            .catch((error) =>{
                console.log('error: ', error);
            })
            .finally(()=>{
                this.emailModal = false;
                this.selectedFinalData = [];
                this.selectedEmail = [];
                this.selectedEmailCC = [];
            });
        }
    }
    showCCInput(){
        this.showCC = true;
    }
    handleCCValue(event){
        this.selectedEmailCC.push(event.target.value);
    }
    handleLogCallComment(event){
        this.commentValue = event.target.value;
    }

    /**
 * Creates tasks based on selected log calls.
 * Iterates over selectedLogCall and selectedEmail arrays to find matching contact IDs.
 * Constructs a task list using the unique contact IDs and the provided commentValue.
 * Calls the createTaskOnCall Apex method with the constructed task list.
 * Shows a success toast message if the tasks are created successfully.
 * Reloads the page after successful task creation.
 * Shows an error toast message if there is an error during task creation.
 * Finally, closes the call modal.
 */
    createTask(){
        let uniqueContactIds = []
        for(let x of this.selectedLogCall){
            for(let y of this.selectedEmail){
                if(x.ContactEmail === y){
                    uniqueContactIds.push(x.ContactId);
                }
            }
        }
        let taskList = uniqueContactIds.map(contactId => ({
            Subject: 'Call',
            TaskSubtype: 'Call',
            WhatId: this.recordId,
            WhoId: contactId,
            Description: this.commentValue
        }));
        console.log('taskList: ', JSON.stringify(taskList));

        createTaskOnCall({JSONTaskList: JSON.stringify(taskList)})
        .then((data)=> {
            if(data){
                //show success toast for logged call
                const toastEvent = new ShowToastEvent({
                    title: 'Success',
                    message: 'Great!! Call logged',
                    variant: 'success',
                });
                this.dispatchEvent(toastEvent);
                console.log('task created');
                location.reload();
            }else{
                console.log('task not created');
                //show error toast
                const toastEvent = new ShowToastEvent({
                    title: 'Error',
                    message: 'Some Error Occured',
                    variant: 'error',
                });
                this.dispatchEvent(toastEvent);
            }
        })
        .catch((error)=>{
            console.log('error in call logging: ', error.message);
            //show toast for error
            const toastEvent = new ShowToastEvent({
                title: 'Error',
                message: 'Some Error Occured',
                variant: 'error',
            });
            this.dispatchEvent(toastEvent);
        })
        .finally(()=>{
            this.callModal = false;
        })
    }
    
}