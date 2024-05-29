import { useState, useRef, useEffect } from 'react';
import Dropdown from './Dropdown';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faInfoCircle, faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Joyride from 'react-joyride';
import { getJoyrideStyles } from './utils/getJoyrideStyles';

const Card = ({ rangeValue, setRangeValue, onSearch, onCenter, darkMode, coordinates }) => {
  const { t } = useTranslation();

  const dropdownItems1 = [
    { label: t('card.fuel.all'), href: '#' },
    { label: t('card.fuel.gasoline'), href: '#' },
    { label: t('card.fuel.diesel'), href: '#' },
    { label: t('card.fuel.gpl'), href: '#' },
    { label: t('card.fuel.methane'), href: '#' },
  ];

  const dropdownItems2 = [
    { label: t('card.brand.all'), href: '#' },
    { label: t('card.brand.eni'), href: '#' },
    { label: t('card.brand.esso'), href: '#' },
    { label: t('card.brand.ip'), href: '#' },
    { label: t('card.brand.q8'), href: '#' },
  ];

  const sortingOptions = [
    { label: t('card.sort.select'), href: '#' },
    { label: t('card.sort.price'), href: '#' },
    { label: t('card.sort.distance'), href: '#' }
  ];

  const [isSelfServed, setIsSelfServed] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [runTutorial, setRunTutorial] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedSort, setSelectedSort] = useState(null);
  const autocompleteService = useRef(null);
  const autocompleteInput = useRef(null);

  useEffect(() => {
    if (!autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  const handleSearch = (input) => {
    if (typeof input === 'string') {
      const request = {
        query: input,
        fields: ['place_id'],
      };

      const service = new window.google.maps.places.PlacesService(autocompleteInput.current);
      service.findPlaceFromQuery(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          onSearch(results[0].place_id);
        }
      });
    } else {
      onSearch(input);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (value) {
      autocompleteService.current.getPlacePredictions({ input: value }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      });
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchInput(suggestion.description);
    setSuggestions([]);
    handleSearch(suggestion.place_id);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchInput);
    }
  };

  const handleApiRequest = () => {
    if (!coordinates) {
      alert('Please select a location on the map.');
      return;
    }

    const apiUrl = 'http://localhost:3000';
    const params = {
      points: [coordinates],
      radius: rangeValue,
      fuelType: selectedFuel ? selectedFuel : 'all',
      selfService: isSelfServed ? '1' : '0'
    };

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      body: JSON.stringify(params)
    })
      .then(response => response.json())
      .then(data => {
        console.log("Response:", data);
        // Handle the response data as needed
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  const steps = [
    {
      target: '.search-input',
      content: t('tutorial.searchInput'),
    },
    {
      target: '.fuel-dropdown',
      content: t('tutorial.fuelDropdown'),
    },
    {
      target: '.brand-dropdown',
      content: t('tutorial.brandDropdown'),
    },
    {
      target: '.range-selector',
      content: t('tutorial.rangeSelector'),
    },
    {
      target: '.serviced-checkbox',
      content: t('tutorial.servicedOrNot'),
    },
    {
      target: '.search-button',
      content: t('tutorial.searchButton'),
    },
    {
      target: '.position-button',
      content: t('tutorial.positionButton'),
    },
    {
      target: '.info-button',
      content: t('tutorial.infoButton'),
    },
    {
      target: '.flag-button',
      content: t('tutorial.flagButton'),
    },
    {
      target: '.dark-mode-toggle',
      content: t('tutorial.darkMode'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg"
    >
      <Joyride
        steps={steps}
        run={runTutorial}
        continuous={true}
        showSkipButton={true}
        styles={getJoyrideStyles(darkMode)}
      />
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 relative search-input">
            <label className="block text-sm text-gray-900 dark:text-gray-300 mb-1">{t('card.searchInput')}</label>
            <input
              ref={autocompleteInput}
              type="text"
              value={searchInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="w-full p-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-300 pr-10"
            />
            <button
              className="absolute right-2 top-11 transform -translate-y-1/2 text-gray-700 dark:text-gray-300"
              onClick={() => handleSearch(searchInput)}
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="col-span-1 fuel-dropdown">
            <Dropdown title={t('card.carburante')} items={dropdownItems1} onSelect={setSelectedFuel} />
          </div>
          <div className="col-span-1 brand-dropdown">
            <Dropdown title={t('card.tipo')} items={dropdownItems2} onSelect={setSelectedBrand} />
          </div>
          <div className="col-span-1 range-selector">
            <label className="block text-sm text-gray-900 dark:text-gray-300 mb-1">{t('card.range')} {rangeValue}</label>
            <input 
              type="range" 
              min="0.5" 
              max="10" 
              step="0.5" 
              value={rangeValue} 
              onChange={(e) => setRangeValue(parseFloat(e.target.value))} 
              className="w-full" 
            />
          </div>
          <div className="col-span-1 serviced-checkbox flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">{t('card.servicedOrNot')}</span>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isSelfServed} onChange={() => setIsSelfServed(!isSelfServed)} />
              <div className="relative w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                <AnimatePresence mode='wait'>
                  <motion.span
                    key={isSelfServed ? "Self" : "Serviced"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {isSelfServed ? t('card.self') : t('card.serviced')}
                  </motion.span>
                </AnimatePresence>
              </span>
            </label>
          </div>
          <div className="col-span-2 sort-dropdown">
            <Dropdown title={t('card.sort.select')} items={sortingOptions} onSelect={setSelectedSort} />
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <button className="search-button bg-purple-600 text-white p-2 rounded hover:bg-purple-700 flex items-center" onClick={handleApiRequest}>
          <FontAwesomeIcon icon={faSearch} className="mr-2" /> {t('card.search')}
        </button>
        <button className="position-button bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center" onClick={onCenter}>
          <FontAwesomeIcon icon={faLocationCrosshairs} className="mr-2" /> {t('card.position')}
        </button>
        <button className="info-button bg-gray-600 text-white p-2 rounded hover:bg-gray-700 flex items-center" onClick={() => setRunTutorial(true)}>
          <FontAwesomeIcon icon={faInfoCircle} className="mr-1 ml-1" />
        </button>
      </div>
    </motion.div>
  );
};

Card.propTypes = {
  rangeValue: PropTypes.number.isRequired,
  setRangeValue: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onCenter: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired,
  coordinates: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
};

export default Card;
