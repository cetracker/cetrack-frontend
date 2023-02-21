import { Box } from "@mantine/core";

const styledLinkBox = (theme) => ({
    color: theme.colors.blue[5],
    textDecoration: 'none',

    '&:hover': {
    color: theme.colors.blue[7],
    },
})


// Box with custom element
const ElementBox = () => {
  return (
    <Box
      component="a"
      href="https://mantine.dev"
      target="_blank"
      sx={styledLinkBox}
      > Mantine Homepage
    </Box>
  );
}

  export default ElementBox;
