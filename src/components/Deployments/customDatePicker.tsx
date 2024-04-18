import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import React, { useState } from 'react';

const CustomDatePicker = (props: any) => {
  const [date, setDate] = useState(null);

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
        margin="none"
        id="date-picker-dialog"
        label="Date picker"
        format="MM/dd/yyyy"
        clearable
        value={date}
        onChange={(event: any) => {
          setDate(event);
          props.onFilterChanged(props.columnDef.tableData.id, event);
        }}
        KeyboardButtonProps={{
          'aria-label': 'change date',
        }}
      />
    </MuiPickersUtilsProvider>
  );
};
export default CustomDatePicker;
