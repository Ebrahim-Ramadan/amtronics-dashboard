export interface Product {
  _id: string
  id: number
  sku: string
  en_name: string
  ar_name: string
  en_description: string
  ar_description: string
  en_long_description: string
  ar_long_description: string
  en_main_category: string
  ar_main_category: string
  en_category: string
  ar_category: string
  price: number
  image: string
  quantity_on_hand: number
  sold_quantity: number
  visible_in_catalog: number
  visible_in_search: number
  slug_url: string
  discount?: number
  discount_type?: string
  ar_brand?: string
  en_brand?: string
  ave_cost?: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface PromoCode {
  _id: string
  code: string
  percentage: number
  expiry: Date
  active: boolean
}

export interface Order {
  _id?: string
  items: CartItem[]
  customerInfo: CustomerInfo
  total: number
  discount: number
  promoCode?: string
  status: string
  createdAt: Date
  shippingFee?: number
}

export interface CustomerInfo {
  name: string
  phone: string
  email: string
  country: string
  city: string
  area: string
  block: string
  street: string
  house: string
}
