import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  port: number;
  stripeSecret: string;
  stripeSuccessUrl: string;
  stripeCancelUrl: string;
  stripeEndpointSecret: string;
  natsServer: string[];
}

const schema = joi
  .object({
    PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    STRIPE_SECRET: joi.string().required(),
    STRIPE_SUCCESS_URL: joi.string().required(),
    STRIPE_CANCEL_URL: joi.string().required(),
    STRIPE_ENDPOINT_SECRET: joi.string().required(),
  })
  .unknown(true);
const { value, error } = schema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS.split(','),
});
if (error) {
  throw new Error(`Config values error ${error}`);
}

export const env: EnvVars = {
  port: value.PORT,
  stripeSecret: value.STRIPE_SECRET,
  stripeSuccessUrl: value.STRIPE_SUCCESS_URL,
  stripeCancelUrl: value.STRIPE_CANCEL_URL,
  stripeEndpointSecret: value.STRIPE_ENDPOINT_SECRET,
  natsServer: value.NATS_SERVERS,
};
