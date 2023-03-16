import { Button, Code, Container, createStyles, Group, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link, useRouteError } from 'react-router-dom';

const useStyles = createStyles((theme) => ({
  root: {
    paddingTop: 40,
    paddingBottom: 40,
  },

  label: {
    textAlign: 'center',
    fontWeight: 800,
    fontSize: 120,
    lineHeight: 1,
    marginBottom: theme.spacing.xl * 1.5,
    color: theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2],

    [theme.fn.smallerThan('sm')]: {
      fontSize: 80,
    },
  },

  description: {
    maxWidth: 500,
    margin: 'auto',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl * 1.1,
  },
}));

const NotFoundPage = () => {
  const { classes } = useStyles();
  const error = useRouteError();

  return (
    <Container className={classes.root} align="center" >
      <div className={classes.label}>{error.response.status}</div>
      { error.response.status >=500 ? (
        <>
          <Title order={4}>This is an unexpected internal error.</Title>
          <Text color="dimmed" size="lg" align="center" className={classes.description}>
            Please try again shortly.
          </Text>
        </>
      ) : (
        <>
          <Title order={4}>You have found a secret place.</Title>
          <Text color="dimmed" size="lg" align="center" className={classes.description}>
            Unfortunately, this is only a 404 page. You may have mistyped the address, or the page has
            been moved to another URL.
          </Text>
          <Text color="red" size="xs" align="center">
            {error.statusText || error.message}
          </Text>
        </>
      )}
      <Group position="center">
        <Button component={Link} to ="/" size="md" leftIcon={<IconArrowLeft size={16} stroke={1.5} />}>
          Take me back to home page
        </Button>
      </Group>
      { error.response?.data ? (
        <Code block={true}>
          {error.response.data.timestamp}
          {'\n'}
          {error.response.data.status} {error.response.data.error}
          {'\n'}
          {error.response.data.message}
          {'\n'}
          {error.response.data.path}
        </Code>
      ):(<></>)}
    </Container>
  );
}

export default NotFoundPage;
