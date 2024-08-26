import Checkbox from '@mui/material/Checkbox';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { TextField } from '@mui/material';
import { ListOptionType } from '../types';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;


interface PillsAutoCompleteProps {
  options: ListOptionType[];
  value?: any[];
  onChange?: (value: any[]) => void;
  label: string;
  placeholder?: string;
}

export default function PillsAutoComplete(props: PillsAutoCompleteProps) {

  const { options, value, onChange, label, placeholder } = props;

  const handleOnChange = (event: React.ChangeEvent<{}>, value: ListOptionType[]) => {
    const newValue = value.map((v) => v.value);
    onChange?.(newValue);
  };
  
  return (
    <Autocomplete
      multiple
      id="checkboxes-tags-demo"
      size="small"
      options={options}
      disableCloseOnSelect
      value={options.filter((option) => value?.includes(option.value))}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      getOptionLabel={(option) => option.title}
      onChange={handleOnChange}
      renderOption={(props, option, { selected }) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {option.title}
          </li>
        );
      }}
      style={{ width: '100%' }}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder} />
      )}
    />
  );
}