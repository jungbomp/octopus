export const config = {
  db: {
    type: process.env.DB_TYPE || 'mysql',
    synchronize: false,
    logging: false,
    host: process.env.DB_HOST || 'hatandbeyond-inven.ckbf4syfoopj.us-west-1.rds.amazonaws.com',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'HatAndBeyond',
    password: process.env.DB_PASSWORD || 'Happy10*',
    database: 'HDB',
    autoLoadEntities: true,
    extra: {
      connectionLimit: 30,
    },
  },
  graphql: {
    debug: false,
    playground: false,
    autoSchemaFile: true,
  },
  foo: 'pro-bar',
};
  