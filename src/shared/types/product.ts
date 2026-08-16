export interface Product {
  id: string
  name: string
  price: number
  stock: number
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}
