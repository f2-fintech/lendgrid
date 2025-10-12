import { useQuery, useMutation, useQueryClient } from 'react-query';
import { gql } from 'graphql-request';
import { apiClient } from '@/lib/api-client';

export interface Product {
  _id: string;
  name: string;
  description: string;
  lenderId: {
    _id: string;
    username: string;
    email: string;
  };
  productType: string;
  interestRate: number;
  maxLoanAmount: number;
  minLoanAmount: number;
  loanTerm: number;
  eligibilityCriteria: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  results: Product[];
  count: number;
  page: number;
  pages: number;
}

interface ProductsQueryVariables {
  page?: number;
  limit?: number;
  lenderId?: string;
  productType?: string;
  isActive?: boolean;
}

const fetchProducts = async (variables: ProductsQueryVariables): Promise<PaginatedProducts> => {
  const query = gql`
    query products($page: Int, $limit: Int, $lenderId: String, $productType: String, $isActive: Boolean) {
      products(query: { page: $page, limit: $limit, lenderId: $lenderId, productType: $productType, isActive: $isActive }) {
        results {
          _id
          name
          description
          lenderId {
            _id
            username
            email
          }
          productType
          interestRate
          maxLoanAmount
          minLoanAmount
          loanTerm
          eligibilityCriteria
          isActive
          createdAt
          updatedAt
        }
        count
        page
        pages
      }
    }
  `;
  const data = await apiClient.request(query, variables);
  return data.products;
};

export const useProducts = (variables: ProductsQueryVariables) => {
  return useQuery<PaginatedProducts, Error>(['products', variables], () => fetchProducts(variables));
};

const createProduct = async (productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt' | 'lenderId'> & { lenderId: string }) => {
  const mutation = gql`
    mutation createProduct($createProductInput: CreateProductDto!) {
      createProduct(createProductInput: $createProductInput) {
        _id
      }
    }
  `;
  const data = await apiClient.request(mutation, { createProductInput: productData });
  return data.createProduct;
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation(createProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries('products');
    },
  });
};

const updateProduct = async ({ id, ...productData }: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt' | 'lenderId'>> & { id: string; lenderId?: string }) => {
  const mutation = gql`
    mutation updateProduct($id: ID!, $updateProductInput: UpdateProductDto!) {
      updateProduct(id: $id, updateProductInput: $updateProductInput) {
        _id
      }
    }
  `;
  const data = await apiClient.request(mutation, { id, updateProductInput: productData });
  return data.updateProduct;
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation(updateProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries('products');
    },
  });
};

const removeProduct = async (id: string) => {
  const mutation = gql`
    mutation removeProduct($id: ID!) {
      removeProduct(id: $id) {
        _id
      }
    }
  `;
  const data = await apiClient.request(mutation, { id });
  return data.removeProduct;
};

export const useRemoveProduct = () => {
  const queryClient = useQueryClient();
  return useMutation(removeProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries('products');
    },
  });
};
