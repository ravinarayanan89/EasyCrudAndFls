import { LightningElement } from 'lwc';
import getAllObjects from '@salesforce/apex/EasyCrudAndFls.getAllObjects';

export default class EasyCrudAllObjects extends LightningElement {

        allObjectsInOrg = [];
        isLoading = false;
        status = '';
        showObjectCrud = false;
        showFls = false;
        object = '';
        filteredObjects = [];
        connectedCallback(){
            this.getObjects();
        }

        //Get all the Objects in Org
        getObjects(){
            this.isLoading = true;
            this.status = 'Please Wait while we are fetching all the objects in the Org..'
            getAllObjects({

            }).then(result => {
                this.status = 'Fetched Objects Sucessfully..'
                let count = 1;
                result = JSON.parse(JSON.stringify(result));
                let allObjects = [];
                let processedObjects = new Set();
                for(var item of result){
                        //Avoid Duplicate Rows
                        if(!processedObjects.has(item.SobjectType)){ 
                                allObjects.push(item);
                        }
                        processedObjects.add(item.SobjectType);
                }
                this.allObjectsInOrg = allObjects;
                this.filteredObjects = JSON.parse(JSON.stringify(this.allObjectsInOrg));
                this.isLoading = false;
                this.status = '';
            }).catch(error => {
                console.log(error);
            })
        }

        //Search for the Object based on keyword from User.
        handleObjectSearch(event){
                var searchKey = event.detail.value;
                let filteredResults = [];
                for(var item of this.allObjectsInOrg){
                    if(!searchKey || item.SobjectType.toLowerCase().includes(searchKey.toLowerCase())){
                        filteredResults.push(item);
                    }
                }
                this.filteredObjects = [...filteredResults];
        }

        //Open Object Permissions
        handleCrud(event){
            this.object = event.target.name;
            this.showObjectCrud = true;
            this.showFls = false;
        }
        

        closeModal(event){
            this.showObjectCrud =false;
            this.showFls = false;
        }

        //Open Field Level Permissions
        handleFls(event){

            this.object = event.target.name;
            this.showObjectCrud = false;
            this.showFls = true;
        }

}