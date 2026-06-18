import { gqlFetch } from './http-client'
import { DealLender } from './api-types'

export const dealLendersApi = {
  getDealLenders: () =>
    gqlFetch<{ getDealLenders: any[] }>({
      query: `
        query GetDealLenders {
          getDealLenders {
            _id
            name
            type
            status
          }
        }
      `,
    }).then(res => (res.getDealLenders || []).map(l => ({ 
      ...l, 
      id: l._id, 
      type: (l.type || '').toLowerCase(),
      status: (l.status || '').toLowerCase()
    } as any))),

  getAllDealLenders: () =>
    gqlFetch<{ getAllDealLenders: any[] }>({
      query: `
        query GetAllDealLenders {
          getAllDealLenders {
            _id
            name
            type
            status
            createdAt
            updatedAt
          }
        }
      `,
    }).then(res => (res.getAllDealLenders || []).map(l => ({ 
      ...l, 
      id: l._id, 
      type: (l.type || '').toLowerCase(),
      status: (l.status || '').toLowerCase()
    } as any))),

  createDealLender: (input: { name: string; type: string }) =>
    gqlFetch<{ createDealLender: any }>({
      query: `
        mutation CreateDealLender($input: CreateDealLenderInput!) {
          createDealLender(input: $input) {
            _id
            name
            type
            status
          }
        }
      `,
      variables: { 
        input: {
          ...input,
          type: input.type.toUpperCase()
        } 
      },
    }).then(res => {
      const l = res.createDealLender
      return l ? ({ 
        ...l, 
        id: l._id, 
        type: (l.type || '').toLowerCase(),
        status: (l.status || '').toLowerCase()
      } as any) : null as any
    }),

  updateDealLender: (input: { id: string; name?: string; type?: string; status?: string }) =>
    gqlFetch<{ updateDealLender: any }>({
      query: `
        mutation UpdateDealLender($input: UpdateDealLenderInput!) {
          updateDealLender(input: $input) {
            _id
            name
            type
            status
          }
        }
      `,
      variables: { 
        input: {
          ...input,
          type: input.type ? input.type.toUpperCase() : undefined,
          status: input.status ? input.status.toUpperCase() : undefined
        } 
      },
    }).then(res => {
      const l = res.updateDealLender
      return l ? ({ 
        ...l, 
        id: l._id, 
        type: (l.type || '').toLowerCase(),
        status: (l.status || '').toLowerCase()
      } as any) : null as any
    }),

  deleteDealLender: (id: string) =>
    gqlFetch<{ deleteDealLender: boolean }>({
      query: `
        mutation DeleteDealLender($id: ID!) {
          deleteDealLender(id: $id)
        }
      `,
      variables: { id },
    }).then(res => res.deleteDealLender),
}
