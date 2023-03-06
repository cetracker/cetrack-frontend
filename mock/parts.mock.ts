import { defineMock } from 'vite-plugin-mock-dev-server'

// https://github.com/pengzhanbo/vite-plugin-mock-dev-server

const parts = [
  {
      "boughtAt": null,
      "createdAt": "2023-03-05T17:06:07.751043Z",
      "id": "2dea9b8c-1209-4ed0-b48e-fcc95d71748f",
      "name": "Campagnolo AFS 03 brake disc 160mm original front",
      "partTypes": []
  },
  {
      "boughtAt": null,
      "createdAt": "2023-03-05T17:06:09.443865Z",
      "id": "e19fdcdd-5d7f-40ec-ba41-bbafcbb9e06c",
      "name": "Campagnolo AFS 03 brake disc 160mm original rear",
      "partTypes": []
  },
  {
      "boughtAt": null,
      "createdAt": "2023-03-05T17:06:09.443865Z",
      "id": "a018a130-6f87-4cc8-a960-aa6bab44dd2f",
      "name": "Chain",
      "partTypes": []
  }
]

export default defineMock({
  url: '/api/mock/parts',
  body: parts
})
