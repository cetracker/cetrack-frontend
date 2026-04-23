# Feature request

# Issue with applicatoin flow


# Issues from Console

~~When the grouping icon is pressed the console on firefox shows `TypeError: t.subsring is not a function`~~

Fixed: added `ClickAwayListenerProps={{ mouseEvent: false, touchEvent: false }}` to the notification Snackbar in `NotifyProvider`. The `ClickAwayListener` inside MUI's Snackbar was calling `eventProp.substring(2)` with a non-string value. Disabling click-away event listeners is safe since notifications auto-dismiss and have explicit close buttons.