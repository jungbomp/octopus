export const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  db: {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_SCHEMA,
    autoLoadEntities: true,
    synchronize: true,
    logging: false,
    extra: {
      connectionLimit: 10,
    },
  },
  clockIn: {
    employeeClockManagementFolderId: process.env.CLOCK_IN_MANAGEMENT_FOLDER_ID,
    currentYearFolderId: process.env.CLOCK_IN_CURRENT_YEAR_FOLDER_ID,
    templateFileId: process.env.CLOCK_IN_TEMPLATE_FILE_ID,
  },
  orderForm: {
    defaultSenderEmailAddress: process.env.ORDER_FORM_DEFAULT_SENDER_EMAIL,
    defaultSenderName: process.env.ORDER_FORM_DEFAULT_SENDER_NAME,
    orderFormFolderId: process.env.ORDER_FORM_FOLDER_ID,
  },
  sendGrid: {
    apiKey: process.env.SEND_GRID_API_KEY
  },
  logiwaApiConfig: {
    username: process.env.LOGIWA_API_USERNAME,
    password: process.env.LOGIWA_API_PASSWORD,
    baseUrl: process.env.LOGIWA_API_BASE_URL,
    apiBaseUrl: process.env.LOGIWA_API_API_BASE_URL,
    depositorId: process.env.LOGIWA_API_DEPOSITOR_ID,
    warehouseId: process.env.LOGIWA_API_WAREHOUSE_ID,
    numberOfApiCallPerSecond: process.env.LOGIWA_API_NUMBER_OF_API_CALL_PER_SECOND,
    inventoryItemMapFilename: process.env.LOGIWA_API_INVENTORY_ITEM_MAP_FILENAME
  },
  walmartApiConfig: {
    username: process.env.WALMART_API_USERNAME,
    password: process.env.WALMART_API_PASSWORD,
    baseUrl: process.env.WALMART_API_BASE_URL,
    habClientToken: {
      clientId: process.env.WALMART_API_HAB_CLIENT_ID,
      clientSecret: process.env.WALMART_API_HAB_CLIENT_SECRET,
    },
    maCroixClientToken: {
      clientId: process.env.WALMART_API_MA_CLIENT_ID,
      clientSecret: process.env.WALMART_API_MA_CLIENT_SECRET,
    }
  },
  ebayApiConfig: {
    baseUrl: process.env.EBAY_API_BASE_URL,
    authUrl: process.env.EBAY_API_AUTH_URL,
    appId: process.env.EBAY_API_APP_ID,
    devId: process.env.EBAY_API_DEV_ID,
    certId: process.env.EBAY_API_CERT_ID,
    redirectUri: process.env.EBAY_API_REDIRECT_URI,
    habRefreshToken: process.env.EBAY_API_HAB_REFRESH_TOKEN,
    habRefreshTokenExpires: process.env.EBAY_API_HAB_REFRESH_TOKEN_EXPIRES,
    maRefreshToken: process.env.EBAY_API_MA_REFRESH_TOKEN,
    maRefreshTokenExpires: process.env.EBAY_API_MA_REFRESH_TOKEN_EXPIRES,
  },
  amazonSPApiConfig: {
    authUrl: process.env.AMAZON_SP_API_AUTH_URL,
    baseUrl: process.env.AMAZON_SP_API_BASE_URL,
    habClientToken: {
      refreshToken: process.env.AMAZON_SP_API_HAB_REFRESH_TOKEN,
      clientId: process.env.AMAZON_SP_API_HAB_CLIENT_ID,
      clientSecret: process.env.AMAZON_SP_API_HAB_CLIENT_SECRET,
    },
    maCroixClientToken: {
      refreshToken: process.env.AMAZON_SP_API_MA_REFRESH_TOKEN,
      clientId: process.env.AMAZON_SP_API_MA_CLIENT_ID,
      clientSecret: process.env.AMAZON_SP_API_MA_CLIENT_SECRET,
    },
    habSellerId: process.env.AMAZON_SP_API_HAB_SELLER_ID,
    maCroixSellerId: process.env.AMAZON_SP_API_MA_SELLER_ID,
  },
  awsIamConfig: {
    userName: process.env.AWS_IAM_USER_NAME,
    accessKey: process.env.AWS_IAM_ACCESS_KEY,
    secretAccessKey: process.env.AWS_IAM_SECRET_ACCESS_KEY,
    roleArn: process.env.AWS_IAM_ROLE_ARN,
    consoleLoginLink: process.env.AWS_IAM_CONSOLE_LOGIN_LINK,
    awsRegion: process.env.AWS_REGION,
    stsUrl: process.env.AWS_STS_URL,
  },
  foo: 'dev-bar',
};
