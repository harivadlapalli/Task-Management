import { LightningElement, track, wire } from 'lwc';
import getUserTasks from '@salesforce/apex/TaskController.getUserTasks';
import createTask from '@salesforce/apex/TaskController.createTask';
import deleteTask from '@salesforce/apex/TaskController.deleteTask';
import updateTaskStatus from '@salesforce/apex/TaskController.updateTaskStatus';
import { refreshApex } from '@salesforce/apex';


export default class TaskManager extends LightningElement {
    @track tasks = [];
    @track taskName = '';
    @track taskDescription = '';
    @track dueDate = '';
    @track taskPriority = '';
    @track taskStatus = 'New';
    @track isModalOpen = false;
    @track isUpdateStatusModalOpen = false;
    @track selectedStatus;
    @track taskIdForStatusUpdate;

    @track isPriorityFilterOpen = false;
    @track isStatusFilterOpen = false;


    @track columns = [
        { label: 'Task Name', fieldName: 'Name' },
        { label: 'Description', fieldName: 'Description__c' },
        { label: 'Due Date', fieldName: 'Due_Date__c', type: 'date' },
        { label: 'Priority', fieldName: 'Priority__c' },
        { label: 'Status', fieldName: 'Status__c' },
        {
            label: 'Action',
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: 'Update Status', name: 'update_status', type: 'button', variant: 'brand' },
                    { label: 'Delete', name: 'delete', type: 'button', variant: 'destructive' }
                ]
            }
        }
    ];

    

    togglePriorityFilter() {
        console.log('Priority filter button clicked.');
        this.isPriorityFilterOpen = true;
        console.log('Priority Filter:' + this.isPriorityFilterOpen);
    }

    toggleStatusFilter() {
        console.log('Status filter button clicked.');
        this.isStatusFilterOpen = !this.isStatusFilterOpen;
    }

    // Handle the priority filter change
    handlePriorityFilterChange(event) {
        this.taskPriority = event.detail.value; // Update the priority value
        console.log('Combo Box called:', this.taskPriority);
    }

    // Handle the status filter change
    handleStatusFilterChange(event) {
        this.taskStatus = event.detail.value; // Update the status value
    }

    priorityOptions = [
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' },
    ];

    statusOptions = [
        { label: 'New', value: 'New' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
    ];
    handleTaskNameChange(event) {
        this.taskName = event.target.value;
    }

    handleDescriptionChange(event) {
        this.taskDescription = event.target.value;
    }

    handleDueDateChange(event) {
        this.dueDate = event.target.value;
    }

    handlePriorityChange(event) {
        this.taskPriority = event.target.value;
    }

    handleStatusChange(event) {
        this.taskStatus = event.target.value;
    }

    @wire(getUserTasks,{ priority: '$taskPriority', status: '$taskStatus' })
    wiredTasks({ error, data }) {
        console.log('Wired function triggered');
        console.log('Current Task Priority:', this.taskPriority);
        console.log('Current Task Status:', this.taskStatus);

        if (data) {
            console.log('Tasks retrieved:', data);
            this.tasks = data;
            return refreshApex(this.wiredTasks);
        } else if (error) {
            console.error('Error in wired function:', error);
        }
    }


    openNewTaskModal() {
        this.isModalOpen = true;
    }
    closeModal() {
        this.isModalOpen = false;
        this.clearTaskForm();
    }

    clearTaskForm() {
        this.taskName = '';
        this.taskDescription = '';
        this.dueDate = '';
        this.taskPriority = '';
        this.taskStatus = 'New';
    }

    createTask() {
        if (this.dueDate && new Date(this.dueDate) < new Date()) {
            alert('Due Date cannot be in the past');
            return;
        }

        const task = {
            Name: this.taskName,
            Description__c: this.taskDescription,
            Due_Date__c: this.dueDate,
            Priority__c: this.taskPriority,
            Status__c: this.taskStatus,
        };

        createTask({ newTask: task })
            .then(() => {
                alert('Task created successfully!');
                this.closeModal();
                return getUserTasks(); // Refresh tasks
            })
            .then(data => {
                this.tasks = data;
            })
            .catch(error => {
                console.error('Error creating task:', error);
            });
    }

    // Handle row actions
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'update_status') {
            this.openUpdateStatusModal(row); // Open modal for status update
        } else if (actionName === 'delete') {
            this.deleteTask(row.Id);
        }
    }

    // Open modal for updating status
    openUpdateStatusModal(row) {
        this.selectedStatus = row.Status__c; // Set the current status as default in the dropdown
        this.taskIdForStatusUpdate = row.Id; // Store the task ID
        this.isUpdateStatusModalOpen = true; // Open the modal
    }

    // Close the update status modal
    closeUpdateStatusModal() {
        console.log('Canceled buttton called');
        this.isUpdateStatusModalOpen = false; // Close the modal
    }

    // Handle status change from the combobox
    handleStatusChange(event) {
        this.selectedStatus = event.detail.value; // Get selected status from combobox
    }

    // Save the updated status
    saveUpdatedStatus() {
        updateTaskStatus({ taskId: this.taskIdForStatusUpdate, newStatus: this.selectedStatus })
            .then(() => {
                alert('Task status updated successfully!');
                return getUserTasks(); // Refresh tasks after update
            })
            .then((data) => {
                this.tasks = data; // Update the task list
                this.closeUpdateStatusModal(); // Close the modal after saving
            })
            .catch((error) => {
                console.error('Error updating status:', error);
            });
    }

    deleteTask(taskId) {
        deleteTask({ taskId })
            .then(() => {
                this.tasks = this.tasks.filter((task) => task.Id !== taskId);
                alert('Task deleted successfully!');
            })
            .catch((error) => {
                console.error('Error deleting task:', error);
            });
    }

}
