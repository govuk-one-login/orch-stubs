# Ordering of manual stacks deployment 

The manual stacks directory contains two directories one for the IPV stub and the other for the Auth stub. Each one contains the same two templates: 
- link hosted zone
- dns zone

These manual stacks need to be deployed in a certain order alongside the application stack as they depend on parameters for each other.

1) Firstly we need to deploy the main stub application stack with a Hosted Zone pointing to the desired domain name. 
2) Once this has deployed we can deploy the link hosted zone stack by following the instructions in the README. 
3) Finally we can deploy the dns zones stack by following the instructions in the README.