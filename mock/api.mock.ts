import { defineMock } from 'vite-plugin-mock-dev-server'

// https://github.com/pengzhanbo/vite-plugin-mock-dev-server

export default defineMock({
  url: '/api/test',
  body: {
    a: 1,
    b: 2,
  }
})
