const AWS = require('aws-sdk');
const req = require('request');

class Service {
    async start() {
        if (process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) {
            console.log('Using IAM Role for authentication');

            const service = this;

            // Fetching the credentials from the AWS IAM Service
            // see http://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html
            req.get(`http://169.254.170.2${process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}`, function (error, response, body) {
                if (error) {
                    throw error;
                }

                console.log("received authentication info from AWS");
                const auth = JSON.parse(body);

                // Initialising AWS SDK with retrieved credentials
                // see: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html
                // Even though we have to use `new` here, the constructor initialises global state - no need to keep the returned reference
                new AWS.Config(auth);
                // set the region - see CloudFormation template
                AWS.config.update({ region: process.env.AWS_REGION });
                // get a reference to the CloudWatch service API
                service.cw = new AWS.CloudWatch({ apiVersion: '2010-08-01' });

                service.pollQueues();
            });
        } else {
            console.log('IAM Role not assigned to task');
        }
    }

    pollQueues() {
        //this is not actually implemented in this example
        AMQP.getQueues((error, data) => {
            if (error) {
                throw error;
            }

            if (this.firstPoll) {
                console.log(`Successful connection to RabbitMQ at ${process.env.RABBITMQ_HOST}`);
                this.firstPoll = false;
            }

            if (data && data.body) {
                const queueData = JSON.parse(data.body);
                queueData.forEach((queue) => {
                    this.putValue('NumberOfConsumers', queue.name, queue.consumers);
                    this.putValue('NumberOfMessages', queue.name, queue.messages);
                });
            }
        });

        setTimeout(this.pollQueues.bind(this), this.pollInterval);
    }

    sendValueToCloudWatch(name, queueName, value) {
        const metricData = {
            MetricData: [
                {
                    MetricName: name,
                    Dimensions: [
                        {
                            Name: 'Queue',
                            Value: queueName
                        },
                    ],
                    Unit: 'None',
                    Value: value,
                    Timestamp: new Date(),
                    StorageResolution: 60
                },
            ],
            Namespace: `${this.environmentName}/RABBITMQ`
        };

        this.cw.putMetricData(metricData, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`Successfully logged metrics: ${JSON.stringify(metricData)}`);
            }
        });
    }
}

module.exports = Service;
