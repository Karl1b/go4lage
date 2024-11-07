import { useRef } from 'react';


// This is only to prevent the autocomplete bug on modern browsers:
// Chrome and FF will always autofill password field despite autocomplete set to off.
const MaskedInput = ({password,setPassword}:{password: string, setPassword: (password: string) => void}) => {
 
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = (e:any) => {
    const cursorPosition = e.target.selectionStart;
    const newValue = e.target.value;
    const oldLength = password.length;
    
    if (newValue.length < oldLength) {
      setPassword(password.slice(0, -1));
    } 

    else if (newValue.length > oldLength) {
      const newChar = newValue.charAt(cursorPosition - 1);
      setPassword(password + newChar);
    }

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  return (
    <div className="relative mb-4">
      <input
        ref={inputRef}
        type="text"
        autoCapitalize="off"
        autoComplete="off" 
        autoCorrect="off"
        value={'•'.repeat(password.length)}
        onChange={handleChange}
        className="block w-full rounded-md border border-gray-300 py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        placeholder="Password"
      />
    </div>
  );
};

export default MaskedInput;