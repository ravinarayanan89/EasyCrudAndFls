import { track,LightningElement,api } from 'lwc';
import getObjectPermissions from '@salesforce/apex/EasyCrudAndFls.getObjectPermissions';
import getPermissionSets from '@salesforce/apex/EasyCrudAndFls.getPermissionSets';
import upsertPermissions from '@salesforce/apex/EasyCrudAndFls.upsertPermissions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import chartjs from '@salesforce/resourceUrl/chartJs';

export default class ObjectAndFieldPermissions extends LightningElement {

        originalcrudPermissions;
        modifiedcrudPermissions;

        @api
        sObjectName;

        @api 
        recordId;

        permissionSets = [];
        isLoading = false;
        status = '';
        showReview = false;
        showStatus = false;
        PermissionsCreate = false;
        PermissionsDelete = false;
        PermissionsEdit = false;
        PermissionsRead = false;
        PermissionsModifyAllRecords = false;
        PermissionsViewAllRecords = false;
        showDashBoard = false;
        filterOptions = [
            { "label" : "-- None --",value : "None" , "selected":true},
            { "label" : "Create",value : "PermissionsCreate","selected":false},
            { "label" : "Read",value : "PermissionsRead","selected":false},
            { "label" : "Edit",value : "PermissionsEdit","selected":false},
            { "label" : "Delete",value : "PermissionsDelete","selected":false},
            { "label" : "View All",value : "PermissionsViewAllRecords","selected":false},
            { "label" : "Modify All",value : "PermissionsModifyAllRecords","selected":false},
            { "label" : "Profiles",value : "Profile","selected":false},
            { "label" : "Permission Sets",value : "Permission Set","selected":false},
            {"label" : "Permission Set Groups" , "value"  : "PermissionSetGroup" , selected : false}
        ];

        selectedFilter = 'None';

        connectedCallback(){
                this.showReview = true;
                this.showStatus = false;
                this.getAllProfilesAndPermissionSets();
        }

        getAllProfilesAndPermissionSets(){

            this.isLoading = true;
            this.status = 'Loading all the Profiles and Permission Sets..';

            getPermissionSets({
            }).then(result => {
                this.permissionSets = result;
                this.getObjectExistingPermissionSetsFromApex();

            }).catch(error => {
                console.log(error);
            });
        }

        getObjectExistingPermissionSetsFromApex(){
            this.status = 'Please Wait..Loading all the Permissions for the object '+this.sObjectName;
                getObjectPermissions({
                    "objectName" : this.sObjectName
                }).then(result => {
                    this.isLoading = false;
                    this.status = '';
                    let existingPermissions = new Map();
                    for(var item of result){
                            existingPermissions.set(item.ParentId,item);
                    }
                    this.processObjectPermissions(existingPermissions);
                }).catch(error => {
                    console.log(error);
                });
        }

        processObjectPermissions(existingPermissions){
            let permissionsToUpdate = [];
            for(var item of this.permissionSets){
                 let permissionsObj = {};
                 permissionsObj.PermissionsCreate = false;
                 permissionsObj.PermissionsDelete = false;
                 permissionsObj.PermissionsEdit = false;
                 permissionsObj.PermissionsRead = false;
                 permissionsObj.PermissionsModifyAllRecords = false;
                 permissionsObj.PermissionsViewAllRecords = false;
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
                 permissionsObj.readonly = false;

                 // permission set groups cannot be edited.               
                 if(item.Type == 'Group'){
                    permissionsObj.type = 'PermissionSetGroup';
                    permissionsObj.badgeCls = 'slds-badge slds-theme_error';
                    permissionsObj.readonly = true;
                 }
                 permissionsObj.IsOwnedByProfile = item.IsOwnedByProfile;
                 permissionsToUpdate.push(permissionsObj);

            }
            this.originalcrudPermissions = JSON.parse(JSON.stringify(permissionsToUpdate));
            this.modifiedcrudPermissions = JSON.parse(JSON.stringify(permissionsToUpdate));
        }

        handleObjectSearch(event){
            this.clearValues();
            let searchKey = event.detail.value;

            if(!searchKey){
                    this.isLoading = true;
                    this.status = 'Please Wait..';
            }
            for(var item of this.modifiedcrudPermissions){
                    if(!searchKey || (item.ParentName != null && item.ParentName.toLowerCase().includes(searchKey.toLowerCase()))){
                        item.isVisible = true;
                    }else{
                        item.isVisible = false;
                    }
            }
            this.modifiedcrudPermissions = [...this.modifiedcrudPermissions]; 
            this.isLoading = false;
            this.status = '';
        }

        handleCrudChange(event){
                this.clearValues();
                var index = parseInt(event.target.dataset.index);
                var fieldName = event.target.dataset.field;
                this.modifiedcrudPermissions[index][fieldName] = event.target.checked;

                if(fieldName == 'PermissionsViewAllRecords' && event.target.checked){
                    this.modifiedcrudPermissions[index].PermissionsRead = true;
                }
                if(fieldName == 'PermissionsModifyAllRecords' && event.target.checked){
                    this.modifiedcrudPermissions[index].PermissionsRead = true;
                    this.modifiedcrudPermissions[index].PermissionsEdit = true;
                    this.modifiedcrudPermissions[index].PermissionsDelete = true;
                    this.modifiedcrudPermissions[index].PermissionsCreate = true;
                    this.modifiedcrudPermissions[index].PermissionsViewAllRecords = true;
                }
                if(!this.showStatus){
                        let original = this.originalcrudPermissions[index];
                        let updated = JSON.parse(JSON.stringify(this.modifiedcrudPermissions[index]));
                        delete updated.isModified;
                        delete updated.class;
                        delete updated.isVisible;

                        delete original.isModified;
                        delete original.class;
                        delete original.isVisible;

                        if(JSON.stringify(original) == JSON.stringify(updated)){
                            this.modifiedcrudPermissions[index].isModified = false;
                            this.modifiedcrudPermissions[index].class = '';
                        }
                        else{
                            this.modifiedcrudPermissions[index].isModified = true;
                            this.modifiedcrudPermissions[index].class = 'modified-row';
                        }
                    

                        this.modifiedcrudPermissions = [...this.modifiedcrudPermissions];
                }
        }


        showPreviewOfChanges(event){
            this.clearValues();
            if(!this.showReview){
                    this.showReview = true;
                    this.handleObjectSearch({detail : {value : ''}});
            }
            else{
                this.showReview = false;

                var modifiedPermissions = this.modifiedcrudPermissions;

                for(var item of modifiedPermissions){
                        if(item.isModified){
                                item.isVisible = true;
                        }else{
                            item.isVisible = false;
                        }
                }
                this.modifiedcrudPermissions = modifiedPermissions;

            }
        }

        handleCrudSave(){
            this.clearValues();
            this.isLoading = true;
            this.status = 'Please wait.. Saving to Database..';

            let objPermissions = [];
            let beforeSave = JSON.parse(JSON.stringify(this.modifiedcrudPermissions));

            for(var item of JSON.parse(JSON.stringify(this.modifiedcrudPermissions))){
                    if(item.isModified){
                        objPermissions.push(item);
                    }
            }
            this.modifiedcrudPermissions = objPermissions;

            if(this.modifiedcrudPermissions.length == 0){
                this.modifiedcrudPermissions = beforeSave;
                this.isLoading = false;
                this.status = '';
                this.showToast('Please modify the Permissions and try again!!','NO_CHANGES_FOUND','error');
                return;
            }
            upsertPermissions({
                "permissionsJson":JSON.stringify(objPermissions),
                "isObject" : true
            }).then(result => {
              
                this.isLoading = false;
                this.status = '';
                this.showResults(result,true);
                console.log(result);
            }).catch(error => {
                if(error.body && error.body.message){
                    this.showToast(error.body.message,'ERROR !!','error');
                   // this.closeAction();
                }else{
                    this.showToast(error,'ERROR !!','error');
                }
                this.isLoading = false;
                this.status = '';
            });
        }

        showResults(results,isObject){
                this.showStatus = true;
                var showResults = [];
                var count = 0;

                var permissions = this.modifiedcrudPermissions;

                for(var item of permissions){
                            item.class = '';
                            let resultObj = JSON.parse(results[count]);

                            if(resultObj.recordId){
                                item.Id = resultObj.recordId;
                            }
                            item.status = resultObj.isSuccess ? 'SUCCESS' : resultObj.errorMessage;
                            item.statusCls = resultObj.isSuccess ?  'slds-text-color_success' : 'slds-text-color_destructive';
                            showResults.push(item);
                            count += 1;
                }

                this.modifiedcrudPermissions = showResults;
        }

        closeAction(){
            const selectedEvent = new CustomEvent('close', { detail: true });
            this.dispatchEvent(selectedEvent);
        }

        clearValues(){
            this.PermissionsCreate = false;
            this.PermissionsDelete = false;
            this.PermissionsEdit = false;
            this.PermissionsRead = false;
            this.PermissionsModifyAllRecords = false;
            this.PermissionsViewAllRecords = false;
        }

        selectAll(event){

            this[event.target.name] = event.target.checked;
            if(event.target.name == 'PermissionsViewAllRecords' && event.target.checked){
                    this.PermissionsRead = true;
            }
            if(event.target.name == 'PermissionsModifyAllRecords' && event.target.checked){
                    this.PermissionsRead = true;
                    this.PermissionsEdit = true;
                    this.PermissionsDelete = true;
                    this.PermissionsCreate = true;
                    this.PermissionsViewAllRecords = true;
            }
            var index = 0;

            for(var item of this.modifiedcrudPermissions){

                    if(!item.isVisible){
                            index += 1;
                            continue;
                    }
                    var fieldName = event.target.name;
                    item[fieldName] = event.target.checked;

                    if(fieldName == 'PermissionsViewAllRecords' && event.target.checked){
                        item.PermissionsRead = true;
                    }
                    if(fieldName == 'PermissionsModifyAllRecords' && event.target.checked){
                        item.PermissionsRead = true;
                        item.PermissionsEdit = true;
                        item.PermissionsDelete = true;
                        item.PermissionsCreate = true;
                        item.PermissionsViewAllRecords = true;
                    }
                    if(!this.showStatus){
                            let original = this.originalcrudPermissions[index];
                            let updated = JSON.parse(JSON.stringify(item));
                            delete updated.isModified;
                            delete updated.class;
                            delete updated.isVisible;

                            delete original.isModified;
                            delete original.class;
                            delete original.isVisible;

                            if(JSON.stringify(original) == JSON.stringify(updated)){
                                item.isModified = false;
                                item.class = '';
                            }
                            else{
                                item.isModified = true;
                                item.class = 'modified-row';
                            }
                    }
                    index += 1;
            }

            this.modifiedcrudPermissions = [...this.modifiedcrudPermissions];
            

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
            this.modifiedcrudPermissions.forEach(function (record) {
                Object.keys(record).forEach(function (key) {
                    if(!toAvoidColnHeaders.has(key))
                    rowData.add(key);
                });
            });
    
            rowData.add('SobjectType');
            // Array.from() method returns an Array object from any object with a length property or an iterable object.
            rowData = Array.from(rowData);
            
            // splitting using ','
            csvString += rowData.join(',');
            csvString += rowEnd;
    
            // main for loop to get the data based on key value
            for(let i=0; i < this.modifiedcrudPermissions.length; i++){

                if(!this.modifiedcrudPermissions[i].isVisible){
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
                    else if(rowData.hasOwnProperty(key)) {
                        // Key value 
                        // Ex: Id, Name
                        let rowKey = rowData[key];
                        // add , after every value except the first.

                        // If the column is undefined, it as blank in the CSV file.
                        let value = this.modifiedcrudPermissions[i][rowKey] === undefined ? '' : this.modifiedcrudPermissions[i][rowKey];
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
            downloadElement.download = 'ObjectPermissions_'+this.sObjectName+'.csv';
            // below statement is required if you are using firefox browser
            document.body.appendChild(downloadElement);
            // click() Javascript function to download CSV file
            downloadElement.click(); 

            this.showToast('Export Completed !!','Success','success');
            }

            catch(error){
                this.showToast(error,'EXPORT_FAILED','error');
                console.log('ERROR IS',error);
            }
        }

        //Filter results 
        filterResults(event){
            const field = event.target.name;
            if (field === 'filterSelect') {
                let value = event.target.value;
                this.clearValues();

                for(var item of this.modifiedcrudPermissions){
                        if(value == 'None' || item[value]){
                            item.isVisible = true;
                        }
                        else if(item.type == value){
                            item.isVisible = true;
                        }
                        else{
                            item.isVisible = false;
                        }
                }

                this.modifiedcrudPermissions = [...this.modifiedcrudPermissions]; 

            } 
        }

        generateChart(){

            this.showDashBoard = true;

            let dashBoardData = this.generateDataForDashboard();

            Promise.all([
                loadScript(this, chartjs)
            ])
            .then(() => {
                const labels = ['Create','Read','Edit','Delete','View All','Modify All'];
                const data = {
                labels: labels,
                datasets: [
                    {
                    label: 'Profiles',
                    data: dashBoardData.profiles,
                    backgroundColor: '#fe5c4c',
                    },
                    {
                    label: 'Permission Sets',
                    data: dashBoardData.permissionsets,
                    backgroundColor: '#41b658',
                    }
                ]
                };

            const config = {
                type: 'bar',
                data: data,
                options: {
                  plugins: {
                    title: {
                      display: true,
                      text: 'Chart.js Bar Chart - Stacked'
                    },
                  },
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      stacked: true,
                    },
                    y: {
                      stacked: true,
                    
                    },
                    xAxes: [{
                        barThickness: 100,  // number (pixels) or 'flex'
                        maxBarThickness: 100 // number (pixels)
                    }]
                  }
                }
              };

              const canvas = document.createElement('canvas');
              canvas.setAttribute("width", "800");
              canvas.setAttribute("height", "300");
              this.template.querySelector('div.chart').appendChild(canvas);
              const chartProgress = canvas;

              if (chartProgress) {
                var myChartCircle = new Chart(chartProgress, config);
              }
            });



        }


        generateDataForDashboard(){

            let permissions = [...this.modifiedcrudPermissions];

            let profiles = [];
            profiles.push(permissions.filter(permission => permission.PermissionsCreate && permission.IsOwnedByProfile).length);
            profiles.push(permissions.filter(permission => permission.PermissionsRead && permission.IsOwnedByProfile).length);
            profiles.push(permissions.filter(permission => permission.PermissionsEdit && permission.IsOwnedByProfile).length);
            profiles.push(permissions.filter(permission => permission.PermissionsDelete && permission.IsOwnedByProfile).length);
            profiles.push(permissions.filter(permission => permission.PermissionsViewAllRecords && permission.IsOwnedByProfile).length);
            profiles.push(permissions.filter(permission => permission.PermissionsModifyAllRecords && permission.IsOwnedByProfile).length);

            let permissionSets = [];
            permissionSets.push(permissions.filter(permission => permission.PermissionsCreate && !permission.IsOwnedByProfile).length);
            permissionSets.push(permissions.filter(permission => permission.PermissionsRead && !permission.IsOwnedByProfile).length);
            permissionSets.push(permissions.filter(permission => permission.PermissionsEdit && !permission.IsOwnedByProfile).length);
            permissionSets.push(permissions.filter(permission => permission.PermissionsDelete && !permission.IsOwnedByProfile).length);
            permissionSets.push(permissions.filter(permission => permission.PermissionsViewAllRecords && !permission.IsOwnedByProfile).length);
            permissionSets.push(permissions.filter(permission => permission.PermissionsModifyAllRecords && !permission.IsOwnedByProfile).length);

            return {"profiles":profiles,"permissionsets":permissionSets};


        }

        hideChart(event){
            this.showDashBoard = false;
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
}