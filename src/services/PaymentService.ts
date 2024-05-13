import { Customer, Order, OrderStatus } from "@prisma/client"

import { PaymentData } from "../interfaces/PaymentData"

import { api } from "../lib/api"

export default class PaymentService {
  async process(
    order: Order,
    customer: Customer,
    payment: PaymentData
  ) {
    //? criar o 1customer
    const customerId = await this.createCustomer(customer)
    console.log(`customerId`, customerId)
    //? processar a transação
  }

  private async createCustomer(customer: Customer): Promise<string> {
    // vai fazer uma chamada get para essa rota e com o valor de email
    const customerResponse = await api.get(`/customers?email=${customer.email}`)

    // 1° data vem do axios ja o 2° data vem da api do assas e deixa eles como opcional
    if (customerResponse.data?.data?.length > 0) {
      return customerResponse.data?.data[0]?.id
    }

    const customerParams = {
      name: customer.fullName,
      email: customer.email,
      mobilePhone: customer.mobile,
      cpfCnpj: customer.document,
      postalCode: customer.zipCode,
      address: customer.street,
      addressNumber: customer.number,
      complement: customer.complement,
      province: customer.neighborhood,
      notificationDisabled: true,
    }

    const response = await api.post("/customers", customerParams)

    return response.data?.id
  }
}
