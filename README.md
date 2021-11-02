# octopus
Hat and beyond e-commerce backend

### Config files
  * [Google Drive Octopus](https://drive.google.com/drive/folders/19q4JFG1DzkBzBg0LMnzZjciVaIQJymfo?usp=sharing)
    * Copy 3 files into octopus directory

### frameworks
  * [Nest.js](https://nestjs.com/) - This backend is based on `Nest.js` framework. 
  * Database - Relational database - MySql 8.0 (AWS RDS)
  * ORM - [TypeOrm](https://typeorm.io/#/)

### Requirements
  * Node.js 16.0 or above

### How to run
  * Clone or download repository
  ```
  > git clone https://github.com/jungbomp/octopus.git
  ```
  * Install packages
  ```
  > npm install
  ```
  * Run
    * debug mode
    ```
    > npm run start:debug
    ```
  * Build
    ```
    > npm run build
    ```
    * When the build succeed, `main.js` file is generated in `./dist` directory
    ```
    > node ./dist/main.js
    or
    > pm2 start ecosystem.config.js --only octopus --env development  # if you use management system such as PM2
    or
    > pm2-runtime start ecosystem.config.js --only octopus --env development
    ```
  * Docker image build
    ```
    > docker build . -t octopus:latest
    ```
  * Docker container run
    ```
    > docker run --name octopus -d -p 3000:3000 octopus
    or
    > docker run -p 3000:3000 octopus
    ```
  * Attach to running docker container
    ```
    > docker attach octopus
    ```
    

### Notes
- Initial state
  * `productOrders.service` consturctor searchs current google sheet file id and stores it into class attribute. Also, `clockIn.service` constructor lookup the latest google sheet file id for clock-in and stores it into class attribute. However, those process hit many google api requests, it is not encoursed to do in local or development stage. Thus, those two line is commented initially. When we setup the CI/CD process, will add proper configuration for this initial loading.
  *  `tasks.service` does cron job likes. For local or develop stage, we don't want to run these batch job. Thus, initially, it is commented to prevent it run unintentionally. 
