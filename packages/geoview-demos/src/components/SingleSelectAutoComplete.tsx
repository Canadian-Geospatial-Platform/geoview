import Autocomplete from '@mui/material/Autocomplete';
import { TextField } from '@mui/material';
import { ListOptionType } from '../types';


interface PillsAutoCompleteProps {
  options: ListOptionType[];
  value?: any;
  onChange?: (value: any) => void;
  label: string;
  placeholder?: string;
}

export default function SingleSelectComplete(props: PillsAutoCompleteProps) {

  const { options, value, onChange, label, placeholder } = props;

  const handleOnChange = (event: React.ChangeEvent<{}>, newValue: ListOptionType| null) => {
    if(newValue === null) {
      onChange?.(null);
      return;
    } else {
      onChange?.(newValue.value);
    }
  };
  
  return (
    <Autocomplete
      size="small"
      options={options}
      disableClearable
      value={options.find((option) => option.value === value)}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      getOptionLabel={(option) => option.title}
      onChange={handleOnChange}
      style={{ width: '100%' }}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder} />
      )}
    />
  );
}