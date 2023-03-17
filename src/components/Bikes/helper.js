export const bikeName = (bikeObj) => {
  if (bikeObj) {
    const manufacturer = (bikeObj?.manufacturer) ? bikeObj.manufacturer : '-'
    const model = (bikeObj.model) ? bikeObj.model : '-'
    const bike = manufacturer + " " + model
    return bike
  } else {
    return ''
  }
}
