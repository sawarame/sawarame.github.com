import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import { Button } from '@mui/material';

export default function Password(): JSX.Element {


  return (
    <Layout>
      <MuiTheme>
        <Button variant="contained">Contained</Button>
      </MuiTheme>
    </Layout>
  );
};