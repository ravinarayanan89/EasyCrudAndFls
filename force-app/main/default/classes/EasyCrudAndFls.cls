/**
 * @description       : Bulkification of CRUD and FLS.This class upserts the object and field level permissions.
 * @author            : ravi0389@gmail.com
 * @group             : 
 * @last modified on  : 01-06-2022
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
 * PermissionSet Field Reference Guide
 * https://developer.salesforce.com/docs/atlas.en-us.sfFieldRef.meta/sfFieldRef/salesforce_field_reference_PermissionSet.htm
 * ObjectPermissions
 * https://developer.salesforce.com/docs/atlas.en-us.sfFieldRef.meta/sfFieldRef/salesforce_field_reference_ObjectPermissions.htm
 * FieldPermissions
 * https://developer.salesforce.com/docs/atlas.en-us.sfFieldRef.meta/sfFieldRef/salesforce_field_reference_FieldPermissions.htm
**/
public with sharing class EasyCrudAndFls {
   
    //get all the profiles and permission sets in org. Profiles and Permission Sets are differentiated using isOwnedByProfile
    @AuraEnabled
    public static List<PermissionSet> getPermissionSets(){
            return [Select id,Type,Profile.Id,Profile.Name,IsOwnedByProfile,Name FROM PermissionSet where NameSpacePrefix = NULL ORDER BY IsOwnedByProfile DESC];
    }

        
    //Since System Admin has access to all the objects by default querying the table for getting list of Objects.
    @AuraEnabled(cacheable=true)
    public static List<ObjectPermissions> getAllObjects(){
        return [Select SObjecttype from ObjectPermissions where Parent.profile.Name = 'System Administrator'];
    }


    //List down the fields for the given object. 
    @AuraEnabled(cacheable=true)
    public static String getFields(String objectName){
        try {
            String json_string = '[';
                for(Schema.SObjectField field : schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap().values()){
                    Schema.DescribeFieldResult fr = field.getDescribe();

                    if(!fr.isPermissionable()) //If the fields cannot be given custom permission, then ignoring it.
                        continue;
                    
                    if(json_string != '['){
                        json_string += ',';
                    }
                 
                    json_string += '{"fieldApi":"'+fr.getName()+'","fieldLabel":"'+fr.getLabel()+'"}'; 
                } 
                json_string += ']';
                return json_string;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    //Get the existing permissions. these records needs to be updated. Creating same profile with same object will result in duplciation error
    @AuraEnabled
    public static List<ObjectPermissions> getObjectPermissions(String objectName){
            return [Select id,ParentId,Parent.Name,Parent.Profile.Id,Parent.Profile.Name,Parent.IsOwnedByProfile,PermissionsCreate,PermissionsDelete,PermissionsRead
                    ,PermissionsEdit,PermissionsViewAllRecords,PermissionsModifyAllRecords FROM ObjectPermissions
                    where SobjectType = :objectName];
    }

    //get the existing field permissions. these records will be updated.
    @AuraEnabled
    public static List<FieldPermissions> getFieldPermissions(String objectName,String fieldName){
        return [Select id,Field,ParentId,Parent.Profile.Id,Parent.Profile.Name,Parent.Name,Parent.IsOwnedByProfile,
                PermissionsEdit,PermissionsRead FROM FieldPermissions WHERE SobjectType = :objectName 
                AND Field = :fieldName];      
    }


    //Update the existing permissions and create the new Permissions.
    @AuraEnabled
    public static List<String> upsertPermissions(String permissionsJson,Boolean isObject){
        try {
                    
                    List<Database.UpsertResult> results;
                    if(isObject){
                            List<ObjectPermissions> objPermissions= (List<ObjectPermissions>)System.JSON.deserialize(permissionsJson, List<ObjectPermissions>.class);
                            results = Database.upsert(objPermissions,false);
                     }else{
                            List<FieldPermissions> fls= (List<FieldPermissions>)System.JSON.deserialize(permissionsJson, List<FieldPermissions>.class);
                            results = Database.upsert(fls,false);
                     }
                    List<String> resultsOp = new List<String>();

                    for(Database.UpsertResult sr : results){
                        String json = '{"recordId":"{recordId}","isSuccess":{status},"errorMessage":"{errMsg}"}';

                            String createdRecordId = '';

                            if(sr.getId() != null){
                                createdRecordId = String.valueOf(sr.getId());
                            }

                            json = json.replace('{recordId}',createdRecordId);
                            json = json.replace('{status}',String.valueOf(sr.isSuccess()));
                        

                            String error = '';
                            for(Database.Error err : sr.getErrors()){
                              if(String.isNotBlank(error)){
                                  error+= ',';
                              }
                               error += err.getMessage();
                            }
                            json = json.replace('{errMsg}',error);

                            resultsOp.add(json);
                    }

                    return resultsOp;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}