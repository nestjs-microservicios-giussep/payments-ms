import { Inject, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import Stripe from 'stripe';

import { env, NATS_SERVER } from '../config';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(env.stripeSecret);

  constructor(@Inject(NATS_SERVER) private readonly client: ClientProxy) {}

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;
    const lineItems = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));
    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: env.stripeSuccessUrl,
      cancel_url: env.stripeCancelUrl,
    });
    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url,
    };
  }

  async paymentsWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        env.stripeEndpointSecret,
      );
    } catch (err) {
      res.status(400).json(`Webhook Error: ${err}`);
      return;
    }

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
        const payload = {
          stripePaymentId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.orderId,
          receiptUrl: chargeSucceeded.receipt_url,
        };
        this.client.emit('payment.succeeded', payload);
      default:
        console.log(`Evento ${event.type} no controlado`);
    }
    return res.status(200).json({ sig, event: event.type });
  }
}
