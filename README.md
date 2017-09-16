# ecs-task-role

Example how to set up AWS ECS Task with an assigned IAM Role and how to use the Javascript AWS SDK to push data
into CloudWatch.
Without using IAM Roles you would have to manage a user account for this Task to be able to assign minimal
priviledges. You would also have to pass the credentials to the Task. Using IAM Roles saves all this trouble but
there are a few pieces that need to be done right.

The important bits:
* The IAM Role definition with the trust policy document in the yaml file.
* Assigning the IAM Role to the Task.
* Fetching the credentials from the special AWS URL in the Javascript code.
* Initialising the AWS SDK from the fetched credentials.

There is also a nice example how to push RabbitMQ queue stats to CloudWatch after getting authenticated.  
