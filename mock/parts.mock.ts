import { defineMock } from 'vite-plugin-mock-dev-server'

// https://github.com/pengzhanbo/vite-plugin-mock-dev-server

export default defineMock({
  url: '/api/parts',
  body: { 'parts': [
    {'id': 1, name: 'front wheel high'},
    {'id': 2, name: 'rear wheel high'},
    {'id': 3, name: 'front wheel low'},
    {'id': 4, name: 'rear wheel low'},
    {'id': 5, name: 'chain'}
  ]}
})
