public with sharing class TaskController {
    
    @AuraEnabled(cacheable=true)
    public static List<Task__c> getUserTasks(String priority, String status) {
        String uId = UserInfo.getUserId();
        System.debug('Current User ID: ' + uId);
        String query = 'SELECT Id, Name, Description__c, Due_Date__c, Status__c, Priority__c, Assigned_To__c ' +
        'FROM Task__c WHERE Assigned_To__c = :uId';
        
        if (!String.isBlank(priority)) {
            query += ' AND Priority__c = \'' + priority + '\'';
        }
        if (!String.isBlank(status)) {
            query += ' AND Status__c = \'' + status + '\'';
        }
        System.debug('Query:'+query);
        return Database.query(query);
    }


    @AuraEnabled
    public static void createTask(Task__c newTask) {
        insert newTask;
    }

    @AuraEnabled
    public static void deleteTask(Id taskId) {
        try {
            Task__c task = [SELECT Id FROM Task__c WHERE Id = :taskId];
            delete task;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void updateTaskStatus(Id taskId, String newStatus) {
        Task__c task = [SELECT Status__c FROM Task__c WHERE Id = :taskId];
        task.Status__c = newStatus;
        update task;
    }
}
