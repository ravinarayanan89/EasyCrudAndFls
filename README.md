# What is this REPO.

This repo contains the Salesforce code components (LWC and Apex) which helps us to assign Crud Permissions to both profiles and permission sets from a single screen in BULK based on Keyword. There are also features that supports exporting the permissions , filtering based on permission sets/profiles/various crud permissions. This App also contains the features for providing FLS permissions to both profiles and permissions in bulkified Mode.

# In Case you are not familiar with Git Deployments , Please use the below Unmanaged Package 
https://login.salesforce.com/packaging/installPackage.apexp?p0=04t2x000004FFsK



# App Screenshots. 

# 1 App preview
![App preview](https://github.com/ravinarayanan89/EasyCrudAndFls/blob/main/screenshots/1.png?raw=true)

# 2 Search Based on keyword and Update your Object Permissions.  <i> Exporting Option available too </i>
![App preview](https://github.com/ravinarayanan89/EasyCrudAndFls/blob/main/screenshots/2.png?raw=true)

# 3 Exported Permissions CSV
![App preview](https://github.com/ravinarayanan89/EasyCrudAndFls/blob/main/screenshots/3.png?raw=true)

# 4 Generate Dashboard for your Object Permissions
![App preview](https://github.com/ravinarayanan89/EasyCrudAndFls/blob/main/screenshots/4.png?raw=true)

# 5 Filter the Permissions
![App preview](https://github.com/ravinarayanan89/EasyCrudAndFls/blob/main/screenshots/5.PNG?raw=true)

# 6 Applying Field level Permissions
![App preview](https://github.com/ravinarayanan89/EasyCrudAndFls/blob/main/screenshots/6.png?raw=true)



# How to Use This.

Clone the Repository to your local machine. 
Push the components to your Scratch org using the command <b>sfdx force:source:push -u username.</b><br/>
OR <br/>
Push the components to your sandbox using Salesforce extension for Vscode.( Please create project and authorize your sandbox before this step)


## Post Deployment Actions
A Custom Lightning Tab named Easy Crud and FLS will be created after the package is deployed. Please provide Tab level access for the custom tab to System Admin Profile.


## Read All About It

- [Permission Set Field Reference Guide](https://developer.salesforce.com/docs/atlas.en-us.sfFieldRef.meta/sfFieldRef/salesforce_field_reference_PermissionSet.htm)
- [Object Permissions Field Reference Guide](https://developer.salesforce.com/docs/atlas.en-us.sfFieldRef.meta/sfFieldRef/salesforce_field_reference_ObjectPermissions.htm)
- [Field Permissions Field Reference Guide](https://developer.salesforce.com/docs/atlas.en-us.sfFieldRef.meta/sfFieldRef/salesforce_field_reference_FieldPermissions.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
