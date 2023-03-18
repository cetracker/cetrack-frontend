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
      <List.Item>Add at least one bike via menu entry bikes on the left <IconArrowLeft size={"1rem"}/></List.Item>
      <List.Item>Add Part Types a bike consists off and it's usage you want to track. E.g. Handlebar, Chain, Brake Disc.</List.Item>
      <List.Item>Add Parts you have used, will use or currently use on your bike</List.Item>
      <List.Item>To relate a part to a part type, select the Bike from the Parts table and use the <IconSquareRoundedPlusFilled size={"1rem"} on top of the relation table/> </List.Item>
      <List.Item>Export tours from MyTourBook's Derby DB. Find Instructions on "Import Tours".</List.Item>
      <List.Item>Import the resulting JSON via "Import Tours".</List.Item>
      <List.Item>Find the usage reports on the still to be implemented "Report" page.</List.Item>
    </List>
  </>
export default Index;
