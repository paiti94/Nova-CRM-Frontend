import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, ChevronDown } from 'lucide-react';
import { ClientList } from '../components/Clients/ClientList';
import { AddClientModal } from '../components/Clients/AddClientModal';
import { api, useAuthenticatedApi } from '../services/api';
import Select from 'react-select';
import { useQuery } from '@tanstack/react-query';
const QUERY_KEYS = {
  TAGS: 'tags',
  CLIENTS: 'clients',
}
const Clients = () => {
  const { getAuthToken } = useAuthenticatedApi();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'name' | 'email' | 'company' | 'phone' | 'tags' | 'role'>('name');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { data: availableTags = [] } = useQuery({
    queryKey: [QUERY_KEYS.TAGS],
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get('/tags');
      return data;
    }
  });
  const filterOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'company', label: 'Company' },
    { value: 'phone', label: 'Phone' },
    { value: 'tags', label: 'Tags' },
    { value: 'role', label: 'Role' },
  ];


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Add Client</span>
        </button>
      </div>

      <div className="flex space-x-4">
        <div className="relative">
          <button
            onClick={() => setShowFilterOptions(true)}
            className="px-4 py-2 border rounded-lg flex items-center space-x-2 hover:bg-gray-50"
          >
            <Filter size={20} />
            <span>{filterOptions.find(opt => opt.value === filterBy)?.label || 'Filter'}</span>
            <ChevronDown size={16} />
          </button>

          {showFilterOptions && (
            <>
              <div 
                className="fixed inset-0" 
                onClick={() => setShowFilterOptions(false)}
              />
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterBy(option.value as typeof filterBy);
                      setSelectedTags([]);
                      setSearchQuery('');
                      setShowFilterOptions(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                      filterBy === option.value ? 'bg-gray-100' : ''
                    } ${option.value === filterOptions[0].value ? 'rounded-t-lg' : ''} 
                      ${option.value === filterOptions[filterOptions.length - 1].value ? 'rounded-b-lg' : ''}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
  {filterBy === 'tags' ? (
     <div className="w-64">
     <Select
       isMulti
       placeholder="Select tags..."
       value={availableTags.filter((tag: { value: string; }) => selectedTags.includes(tag.value))}
       onChange={(selected) => {
         const tagValues = (selected as { value: string; label: string }[]).map(tag => tag.value);
         setSelectedTags(tagValues);
       }}
       options={availableTags}
       classNamePrefix="react-select"
     />
   </div>
 ) : (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        placeholder={`Search by ${filterBy}...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  )}
      </div>

      <ClientList
        searchQuery={searchQuery}
        filterBy={filterBy}
        selectedTags={selectedTags}
      />
      {isModalOpen && <AddClientModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default Clients;