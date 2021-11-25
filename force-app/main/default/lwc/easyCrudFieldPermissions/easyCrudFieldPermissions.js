import { track,LightningElement,api } from 'lwc';
import getFieldPermissions from '@salesforce/apex/EasyCrudAndFls.getFieldPermissions';
import getPermissionSets from '@salesforce/apex/EasyCrudAndFls.getPermissionSets';
import upsertPermissions from '@salesforce/apex/EasyCrudAndFls.upsertPermissions';
import getFields from '@salesforce/apex/EasyCrudAndFls.getFields';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ObjectAndFieldPermissions extends LightningElement {

        originalFlspermissions
        modifiedFlsPermissions;

        @api
        sObjectName;

        @api
        fieldName;
        @api 
        recordId;

        permissionSets = [];
        isLoading = false;
        status = '';
        showReview = false;
        showStatus = false;

        allFields = [];
        isFieldsLoading = false;
        isFieldPresent = false;
        PermissionsRead = false;
        PermissionsEdit = false;

        connectedCallback(){
                this.showReview = true;
                this.showStatus = false;
                this.getAllProfilesAndPermissionSets();
        }

        //Get all the Profiles and Permissions and get all the Fields for the sObject
        getAllProfilesAndPermissionSets(){

            this.isLoading = true;
            this.status = 'Loading all the Profiles and Permission Sets..';
            getPermissionSets({
            }).then(result => {
                this.permissionSets = result;
                this.status = 'Please Wait..Loading all the Permissions for the field '+this.fieldName;
                this.getAllFields();
            }).catch(error => {
                  
                if(error.body && error.body.message){
                    this.showToast(error.body.message,'ERROR !!','error');
                   // this.closeAction();
                }else{
                    this.showToast(error,'ERROR !!','error');
                }
            });
        }

        //Get all the Fields using Apex for the given object
        getAllFields(){
      
            this.isLoading = true;
            this.status = 'Please Wait. Loading all the Fields for the Object '+this.sObjectName;
            getFields({
                    "objectName" : this.sObjectName
            }).then(result => {
                result = JSON.parse(result);
                for(var item of result){
                        item.isVisible = true;
                }
                this.allFields = result;
                if(result.length > 0){
                    this.fieldName = result[0].fieldApi;
                    this.fetchPermissions(null);
                }else{
                    this.showToast('No Fields are Present for the Object '+this.sObjectName+' !!','NO_FIELDS','error');
                    this.closeAction();
                }
                this.isLoading = false;
                this.status = '';
            }).catch(error => {
                
                if(error.body && error.body.message){
                    this.showToast(error.body.message,'ERROR !!','error');
                   // this.closeAction();
                }else{
                    this.showToast(error,'ERROR !!','error');
                }
                console.log(error);
            });
        }


        //Get the existing Permissions for the Field. These records needs to be updated for any change.
        getFieldPermissionFromApex(){
            this.PermissionsRead = false;
            this.PermissionsEdit = false;

            getFieldPermissions({
                    "objectName" : this.sObjectName,
                    "fieldName" : this.sObjectName+'.'+this.fieldName
                }).then(result => {
                    this.isFieldsLoading = false;
                    this.status = '';
                    try{
                    let existingPermissions = new Map();
                    for(var item of result){
                            existingPermissions.set(item.ParentId,item);
                    }
                 
                            this.processFieldPermissions(existingPermissions);
                    }
                    catch(error){
                            this.showToast(error,'ERROR !!','error');
                    }
                }).catch(error => {
                        if(error.body && error.body.message){
                            this.showToast(error.body.message,'ERROR !!','error');
                        }else{
                            this.showToast(error,'ERROR !!','error');
                        }
                });
        }


        //Process  the Records for UI handling
        processFieldPermissions(existingPermissions){

            let permissionsToUpdate = [];
            for(var item of this.permissionSets){
                 let permissionsObj = {};
                 permissionsObj.PermissionsEdit = false;
                 permissionsObj.PermissionsRead = false;
                 permissionsObj.SobjectType = this.objectName;
                 permissionsObj.Field = this.sObjectName+'.'+this.fieldName;
                 permissionsObj.ParentId = item.Id;
                 permissionsObj.SobjectType = this.sObjectName;
                 if(existingPermissions.has(item.Id)){
                     permissionsObj = {};
                     permissionsObj = existingPermissions.get(item.Id);
                     delete permissionsObj.Parent;
                 }
                 permissionsObj.isVisible = true;
                 permissionsObj.class = '';
                 if(item.IsOwnedByProfile){
                    permissionsObj.ParentName = item.Profile.Name;
                 }else{
                    permissionsObj.ParentName = item.Name;
                 }
                 permissionsObj.type = item.IsOwnedByProfile ? 'Profile':'Permission Set';
                 permissionsObj.badgeCls = item.IsOwnedByProfile ? 'slds-badge slds-theme_warning' : 'slds-badge slds-theme_success';

                 permissionsToUpdate.push(permissionsObj);

            }
            this.originalFlspermissions = JSON.parse(JSON.stringify(permissionsToUpdate));
            this.modifiedFlsPermissions = JSON.parse(JSON.stringify(permissionsToUpdate));
        }

        //Quick Filter Search
        handleFieldApiSearch(event){
            this.PermissionsRead = false;
            this.PermissionsEdit = false;
            
            let searchKey = event.detail.value;
            for(var item of this.allFields){
                if(!searchKey || (item.fieldApi != null && item.fieldApi.toLowerCase().includes(searchKey.toLowerCase()))
                    || (item.fieldLabel != null && item.fieldLabel.toLowerCase().includes(searchKey.toLowerCase()))){
                    item.isVisible = true;
                }else{
                    item.isVisible = false;
                }
            }
             this.allFields = [...this.allFields]; 
        }


        //Search for Profiles and Permission Sets based on the given keyword
        handleFieldSearch(event){
            this.PermissionsRead = false;
            this.PermissionsEdit = false;

            let searchKey = event.detail.value;

            if(!searchKey){
                    this.isLoading = true;
                    this.status = 'Please Wait..';
            }
            for(var item of this.modifiedFlsPermissions){
                    if(!searchKey || (item.ParentName != null && item.ParentName.toLowerCase().includes(searchKey.toLowerCase()))){
                        item.isVisible = true;
                    }else{
                        item.isVisible = false;
                    }
            }
            this.modifiedFlsPermissions = [...this.modifiedFlsPermissions]; 
            this.isLoading = false;
            this.status = '';
        }

        //Preview of the modified Permissions
        showPreviewOfChanges(event){
            this.PermissionsRead = false;
            this.PermissionsEdit = false;
            if(!this.showReview){
                    this.showReview = true;
                    this.handleFieldSearch({detail : {value : ''}});
            }
            else{
                this.showReview = false;
                var modifiedPermissions = this.modifiedFlsPermissions;
                for(var item of modifiedPermissions){
                        if(item.isModified){
                                item.isVisible = true;
                        }else{
                            item.isVisible = false;
                        }
                }

                this.modifiedFlsPermissions =modifiedPermissions;
            }
        }

        handleFieldSave(){
            this.PermissionsRead = false;
            this.PermissionsEdit = false;
            this.isLoading = true;
            this.status = 'Please wait.. Saving to Database..';

            let objPermissions = [];
            for(var item of JSON.parse(JSON.stringify(this.modifiedFlsPermissions))){
                    if(item.isModified){
                        objPermissions.push(item);
                    }
            }
            this.modifiedFlsPermissions = objPermissions;

            upsertPermissions({
                "permissionsJson":JSON.stringify(objPermissions),
                "isObject" : false
            }).then(result => {
                this.isLoading = false;
                this.status = '';
                this.showResults(result,false);
                console.log(result);
            }).catch(error => {
                if(error.body && error.body.message){
                    this.showToast(error.body.message,'ERROR !!','error');
                }else{
                    this.showToast(error,'ERROR !!','error');
                }
                this.isLoading = false;
                this.status = '';
            });
        }

        showResults(results,isObject){
            this.PermissionsRead = false;
            this.PermissionsEdit = false;

                this.showStatus = true;
                var showResults = [];
                var count = 0;

                var permissions = isObject ? this.modifiedcrudPermissions : this.modifiedFlsPermissions;

                for(var item of permissions){
                           var response = JSON.parse(results[count]);
                            if(Boolean(response.isSuccess)){
                                item.status = 'SUCCESS';
                            }else{
                                item.status = response.errorMessage;
                            }
                            if(response.recordId)
                              item.Id = response.recordId;

                            item.class = '';
                            item.statusCls = item.status == 'SUCCESS' ? 'slds-text-color_success' :'slds-text-color_destructive';
                            showResults.push(item);
                            count += 1;
                }

                if(isObject)
                    this.modifiedcrudPermissions = showResults;
                else 
                    this.modifiedFlsPermissions = showResults;
        }

        handleFlsChange(event){
            this.PermissionsRead = false;
            this.PermissionsEdit = false;
            var index = parseInt(event.target.dataset.index);
            var fieldName = event.target.dataset.field;
            this.modifiedFlsPermissions[index][fieldName] = event.target.checked;
            let original = this.originalFlspermissions[index];
            let updated = JSON.parse(JSON.stringify(this.modifiedFlsPermissions[index]));
            delete updated.isModified;
            delete updated.class;
            delete updated.isVisible;
            delete original.isModified;
            delete original.class;
            delete original.isVisible;

            if(JSON.stringify(original) == JSON.stringify(updated)){
                this.modifiedFlsPermissions[index].class = '';
                this.modifiedFlsPermissions[index].isModified = false;
            }
            else{
                this.modifiedFlsPermissions[index].class = 'modified-row';
                this.modifiedFlsPermissions[index].isModified = true;
            }

            this.modifiedFlsPermissions = [...this.modifiedFlsPermissions];
        }

        closeAction(){
            const selectedEvent = new CustomEvent('close', { detail: true });
            this.dispatchEvent(selectedEvent);
        }

        handleSelectAll(event){
            var fieldName = event.target.name;
            var checked = event.target.checked;
            this[fieldName] = checked;
            var index = 0;

            for(var item of this.modifiedFlsPermissions){

                if(!item.isVisible){
                        index += 1;
                        continue;
                }
                item[fieldName] = checked;
                let original = this.originalFlspermissions[index];
                let updated = JSON.parse(JSON.stringify(item));
                delete updated.isModified;
                delete updated.class;
                delete updated.isVisible;
                delete original.isModified;
                delete original.class;
                delete original.isVisible;
    
                if(JSON.stringify(original) == JSON.stringify(updated)){
                    item.class = '';
                    item.isModified = false;
                }
                else{
                    item.class = 'modified-row';
                    item.isModified = true;
                }

                index += 1;
            }

      
            this.modifiedFlsPermissions = [...this.modifiedFlsPermissions];
        }

        fetchPermissions(event){

                this.PermissionsRead = false;
                this.PermissionsEdit = false;

                this.showReview = true;
                this.showStatus = false;
                this.isFieldPresent = true;
                for(var item of this.template.querySelectorAll('.slds-is-active')){
                    item.className = 'slds-nav-vertical__item';
                }
                if(event){
                    event.currentTarget.className += ' slds-is-active';
                    this.fieldName = event.currentTarget.dataset.field;
                }
                this.status = 'Please Wait while we are loading the Permissions for '+this.fieldName;
                this.isFieldsLoading = true;
                this.getFieldPermissionFromApex(); 
        }

        showToast(message,title,variant) {

            const event = new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
                mode: 'dismissable'
            });
            this.dispatchEvent(event);
        }

        downloadCSVFile() {   

            try{
            let rowEnd = '\n';
            let csvString = '';
            // this set elminates the duplicates if have any duplicate keys
            let rowData = new Set();

            let toAvoidColnHeaders = new Set();
            toAvoidColnHeaders.add('badgeCls');
            toAvoidColnHeaders.add('class');
            toAvoidColnHeaders.add('isVisible');
            // getting keys from data
            this.modifiedFlsPermissions.forEach(function (record) {
                Object.keys(record).forEach(function (key) {
                    if(!toAvoidColnHeaders.has(key))
                    rowData.add(key);
                });
            });
    
            rowData.add('SobjectType');
            rowData.add('Field');
            // Array.from() method returns an Array object from any object with a length property or an iterable object.
            rowData = Array.from(rowData);
            
            // splitting using ','
            csvString += rowData.join(',');
            csvString += rowEnd;
    
            // main for loop to get the data based on key value
            for(let i=0; i < this.modifiedFlsPermissions.length; i++){

                if(!this.modifiedFlsPermissions[i].isVisible){
                        continue;
                }
                let colValue = 0;
    
                // validating keys in data
                for(let key in rowData) {

                    if(colValue > 0){
                        csvString += ',';
                    }

                    if(rowData[key] == 'SobjectType'){
                        csvString += '"'+ this.sObjectName +'"';
                        colValue++;
                    }
                    else if(rowData[key] == 'Field'){
                        csvString += '"'+ this.fieldName +'"';
                        colValue++;
                    }
                    else if(rowData.hasOwnProperty(key)) {
                        let rowKey = rowData[key];
                        let value = this.modifiedFlsPermissions[i][rowKey] === undefined ? '' : this.modifiedFlsPermissions[i][rowKey];
                        csvString += '"'+ value +'"';
                        colValue++;
                    }
                }
                csvString += rowEnd;
            }
    
            // Creating anchor element to download
            let downloadElement = document.createElement('a');
    
            // This  encodeURI encodes special characters, except: , / ? : @ & = + $ # (Use encodeURIComponent() to encode these characters).
            downloadElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvString);
            downloadElement.target = '_self';
            // CSV File Name
            downloadElement.download = 'FieldPermissions_'+this.sObjectName+'_'+this.fieldName+'.csv';
            // below statement is required if you are using firefox browser
            document.body.appendChild(downloadElement);
            // click() Javascript function to download CSV file
            downloadElement.click(); 
            }

            catch(error){
                console.log('ERROR IS',error);
            }
        }

  

}