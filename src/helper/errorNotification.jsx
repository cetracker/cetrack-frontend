import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';


export const showUserError = (title, code, message) =>
notifications.show({
  withCloseButton: true,
  autoClose: 7000,
  title: title,
  message: `${message} \n code: ${code}`,
  color: 'red',
  icon: <IconX size="1.1rem"/>,
  loading: false,
});
