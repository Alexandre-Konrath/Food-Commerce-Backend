import { Customer, Order, PrismaClient } from "@prisma/client"

import { CustomerData } from "../interfaces/CustomerData"
import { PaymentData } from "../interfaces/PaymentData"
import { SnackData } from "../interfaces/SnackData"

import PaymentServices from "./PaymentServices"

export default class CheckoutService {
  private prisma: PrismaClient

  // metodo de inicialização/construção
  constructor() {
    this.prisma = new PrismaClient()
  }

  async process(
    cart: SnackData[],
    customer: CustomerData,
    payment: PaymentData
  ): Promise<{ id: number; transactionId: string; status: string }> {
    //? "puxar" os dados de snacks do BD
    const snacks = await this.prisma.snack.findMany({
      where: {
        id: {
          in: cart.map((snack) => snack.id),
        },
      },
    })
    // console.log(`snacks`, snacks)

    const snacksInCart = snacks.map<SnackData>((snack) => ({
      ...snack,
      price: Number(snack.price),
      quantity: cart.find((item) => item.id === snack.id)?.quantity!,
      subTotal:
        cart.find((item) => item.id === snack.id)?.quantity! *
        Number(snack.price),
    }))
    // console.log(`snackInCart`, snackInCart)

    //? registrar os dados do cliente no BD
    const customerCreated = await this.createCustomer(customer)
    // console.log(`customerCreated`, customerCreated)

    //? criar uma order
    // esta como let pq podemos atribuir novamente para esta variável uma chamda de order.update
    let orderCreated = await this.createOrder(snacksInCart, customerCreated)
    // console.log(`orderCreated`, orderCreated)

    //? processar o pagamento
    const { transactionId, status } = await new PaymentServices().process(
      orderCreated,
      customerCreated,
      payment
    )

    orderCreated = await this.prisma.order.update({
      where: { id: orderCreated.id },
      data: {
        transactionId,
        status,
      },
    })

    return {
      id: orderCreated.id,
      transactionId: orderCreated.transactionId!,
      status: orderCreated.status,
    }
  }

  // metodos de utilidades
  private async createCustomer(customer: CustomerData): Promise<Customer> {
    const customerCreated = await this.prisma.customer.upsert({
      // procura o email do customer
      where: { email: customer.email },
      // se tiver o email ele atualiza todo o customer
      update: customer,
      // se nao tiver ele cria um customer novo
      create: customer,
    })

    return customerCreated
  }

  private async createOrder(
    snacksInCart: SnackData[],
    customer: Customer
  ): Promise<Order> {
    const total = snacksInCart.reduce((acc, snack) => acc + snack.subTotal, 0)
    const orderCreated = await this.prisma.order.create({
      data: {
        total,
        customer: {
          connect: { id: customer.id },
        },
        orderItems: {
          createMany: {
            data: snacksInCart.map((snack) => ({
              snackId: snack.id,
              quantity: snack.quantity,
              subTotal: snack.subTotal,
            })),
          },
        },
      },
      include: {
        customer: true,
        orderItems: { include: { snack: true } },
      },
    })

    return orderCreated
  }
}
