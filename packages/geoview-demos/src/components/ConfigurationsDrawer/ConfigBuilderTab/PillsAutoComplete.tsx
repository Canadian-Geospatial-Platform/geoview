import Checkbox from '@mui/material/Checkbox';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { TextField } from '@mui/material';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export type PillsAutoCompleteOption = {
  title: string;
  value: string;
}

interface PillsAutoCompleteProps {
  options: PillsAutoCompleteOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  label: string;
  placeholder?: string;
}

export default function PillsAutoComplete(props: PillsAutoCompleteProps) {

  const { options, value, onChange, label, placeholder } = props;
  return (
    <Autocomplete
      multiple
      id="checkboxes-tags-demo"
      options={options}
      disableCloseOnSelect
      getOptionLabel={(option) => option.title}
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