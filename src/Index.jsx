import { List, ThemeIcon, Title } from "@mantine/core";
import { IconArrowLeft, IconCircleCheck, IconSquareRoundedPlusFilled } from "@tabler/icons-react";

const Index = () =>
  <>
    <Title order={2}>About</Title>
    <div>This tool enables you to track the usage of parts of your bike.
      If you ever have wondered how many miles you have used a certain part of your bike for, this tool will help you to answer this question.
      The current prerequisite is, that you have tracked all your tours with MyTourBook. Even though importing from other sources would be possible but aren't implemented at the moment.
      Also, you need to add details about the parts and how they were used on your bike. E.g. Have you ever used one tire on your front wheel for a period of time and later on on your rear wheel?
      Or do you change your wheelset on a regular basis?
    </div>
    <div>
      This is just a preview version on a minimal valuable product base.
    </div>
    <Title order={2}>First Steps</Title>
    <List
      spacing="xs"
      size="sm"
      center
      icon={
        <ThemeIcon color="teal" size={24} radius="xl">
          <IconCircleCheck size="1rem" />
        </ThemeIcon>
      }
    >
      <List.Item>Add at least one bike via menu entry bikes on the left <IconArrowLeft size={"1.3rem"}/></List.Item>
      <List.Item>Add the Part Types a bike consists off and it's usage you would like to track. E.g. handlebar, chain, brake disc etc.</List.Item>
      <List.Item>Add the Parts you have used, will use or currently use on your bike</List.Item>
      <List.Item>To relate a part to a part type, select the part by clicking on the row of the parts table and use the <IconSquareRoundedPlusFilled size={"1.3rem"} /> on top of the relation table.</List.Item>
      <List.Item>Export tours from MyTourBook's Derby DB. Find instructions on "Import Tours" and more detailed instructions on the project's GH page.</List.Item>
      <List.Item>Import the resulting JSON via "Import Tours".</List.Item>
      <List.Item>Find the usage reports on the "Report" page.</List.Item>
    </List>
  </>
export default Index;
