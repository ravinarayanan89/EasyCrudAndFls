/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 11-05-2021
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
@isTest 

public with sharing class EasyCrudAndFlsTest {
    
    @isTest
    public static void testgetAllObjects() {

            List<ObjectPermissions> objPermissions= EasyCrudAndFls.getAllObjects();

            System.assert(objPermissions.size() > 0,'Invalid Object Permissions');
    }

    @isTest
    public static void testgetFields() {

            String fields= EasyCrudAndFls.getFields('Account');

            System.assert(fields != '[]' ,'Not Able to find fields for giving FLS in Account Object');

            //Exception Testing
            try{
                EasyCrudAndFls.getFields('Account1');
            }
            catch(exception e){
                    System.assert(e.getMessage().contains('Script-thrown exception'));
            }
    }   

    @isTest
    public static void testgetObjectPermissions() {

            List<ObjectPermissions> objPermissions= EasyCrudAndFls.getObjectPermissions('Account');

            System.assert(objPermissions.size() > 0,'Invalid Object Permissions for Account');
    }

    @isTest
    public static void testgetFieldPermissions() {

            List<FieldPermissions> fieldPermissionsFrAccType= EasyCrudAndFls.getFieldPermissions('Account','Account.Type');

            System.assert(fieldPermissionsFrAccType.size() > 0,'Invalid Field Permissions for Account Type');
    }

    @isTest
    public static void testgetPermissionSets() {

            List<PermissionSet> permissionSets= EasyCrudAndFls.getPermissionSets();

            System.assert(permissionSets.size() > 0,'Invalid Permission Sets for the Org');
    }

    @isTest
    public static void testupsertPermissions() {

            List<ObjectPermissions> objPermissions = EasyCrudAndFls.getObjectPermissions('Account');

            List<String> results= EasyCrudAndFls.upsertPermissions(JSON.serialize(new List<ObjectPermissions>{objPermissions[0]}),true);
            System.assert(JSON.serialize(results).contains('true'),'Upsert Object Permissions Failed');
            
            //Duplicate record testing
            objPermissions[0].Id = null;
            results= EasyCrudAndFls.upsertPermissions(JSON.serialize(new List<ObjectPermissions>{objPermissions[0]}),true);
            System.assert(JSON.serialize(results).contains('false'),'Negative/Duplicate Object Permissions Failed');
            
            List<FieldPermissions> fieldPermissions = EasyCrudAndFls.getFieldPermissions('Account','Account.Type');
            results= EasyCrudAndFls.upsertPermissions(JSON.serialize(new List<FieldPermissions>{fieldPermissions[0]}),false);
            System.assert(JSON.serialize(results).contains('true'),'Upsert Field Permissions Failed');

            try{
                EasyCrudAndFls.upsertPermissions(null,true);  
            }
            catch(exception e){
                System.assert(e.getMessage().contains('Script-thrown exception'),'Exception Coverage Failed!!');
            }
    }
}