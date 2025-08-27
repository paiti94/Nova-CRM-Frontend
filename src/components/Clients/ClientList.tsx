import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, useAuthenticatedApi } from '../../services/api';
import { useEffect, useState } from 'react';
import { Modal } from '../Modal'; 
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import type { ActionMeta, MultiValue } from 'react-select';

type TagOption = { value: string; label: string };

const customStyles = {
  control: (provided: any) => ({
    ...provided,
    borderColor: 'gray', // Change border color
    borderRadius: '20px', // Change border radius
    '&:hover': {
      borderColor: 'blue', // Change border color on hover
    },
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: '#d0d0d0', // Change background color of selected values
    borderRadius: '20px', // Change border radius of selected values
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: '#111817', // Change text color of selected values
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: '#d32f2f', // Change color of the remove button
    ':hover': {
      backgroundColor: '#d32f2f', // Change background color on hover
      color: 'white', // Change text color on hover
    },
  }),
};

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  role: string;
  tags?: string[]; 
}

const roles = ['user', 'admin', 'editor'];
const roleOptions = roles.map(role => ({ value: role, label: role }));

export const ClientList = ({
  searchQuery,
  filterBy,
  selectedTags,
}: {
  searchQuery: string;
  filterBy: 'name' | 'email' | 'company' | 'phone' | 'tags' | 'role';
  selectedTags?: string[];
}) => {
  const { getAuthToken } = useAuthenticatedApi();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [clientTags, setClientTags] = useState<{ [clientId: string]: string[] }>({});

  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);


  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['clients', searchQuery],
    queryFn: async () => {
      await getAuthToken();
      const { data } = await api.get(`/users?search=${searchQuery}`);
      return data;
    },
  });

  useEffect(() => {
    if (clients) {
      const initialTags: { [key: string]: string[] } = {};
      clients.forEach((client) => {
        initialTags[client.id] = client.tags ?? [];
      });
      setClientTags(initialTags);
    }
  }, [clients]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        await getAuthToken();
        const { data } = await api.get('/tags');
        setAvailableTags(data);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
  
    fetchTags();
  }, []);
  
  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await getAuthToken(); 
      return api.delete(`/users/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ clientId, role }: { clientId: string; role: string }) => {
      await getAuthToken(); 
      return api.patch(`/users/role`, { id: clientId, role: role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateTagsMutation = useMutation({
    mutationFn: async ({ clientId, tags }: { clientId: string; tags: string[] }) => {
      await getAuthToken(); 
      return api.patch(`/users/tags`, { id: clientId, tags }); 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] }); 
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (newTag: TagOption) => {
      await getAuthToken();
      await api.post('/tags', newTag);
    },
  });

  const handleRoleChange = (clientId: string, newRole: string) => {
    setSelectedClientId(clientId);
    setNewRole(newRole);
    setIsModalOpen(true);
  };
  // Open delete confirm
  const confirmDelete = (clientId: string, name?: string) => {
    setDeleteTarget({ id: clientId, name });
    setIsDeleteOpen(true);
  };

  // Execute delete after confirm
  const handleConfirmDelete = () => {
   if (!deleteTarget) return;
   deleteMutation.mutate(deleteTarget.id, {
     onSettled: () => setIsDeleteOpen(false),
   });
  };
  const handleTagChange = (
    clientId: string,
    selected: MultiValue<TagOption>,
    actionMeta: ActionMeta<TagOption>
  ) => {
    // removal of a single tag
    if (actionMeta.action === 'remove-value' || actionMeta.action === 'pop-value') {
      const removed = actionMeta.removedValue;
      const ok = window.confirm(`Remove tag "${removed?.label}"?`);
      if (!ok) return; // ⬅️ do nothing; because value is controlled, UI will revert
    }
  
    // clearing all tags
    if (actionMeta.action === 'clear') {
      const ok = window.confirm('Remove all tags?');
      if (!ok) return;
    }
  
    const tagValues = (selected as TagOption[]).map(t => t.value);
  
    // update local state (controlled value)
    setClientTags(prev => ({ ...prev, [clientId]: tagValues }));
  
    // upsert any newly created tags
    const newOptions = (selected as TagOption[]).filter(
      tag => !availableTags.some(opt => opt.value === tag.value)
    );
    if (newOptions.length) {
      setAvailableTags(prev => [...prev, ...newOptions]);
      newOptions.forEach(tag => createTagMutation.mutate(tag));
    }
  
    // persist
    updateTagsMutation.mutate({ clientId, tags: tagValues });
  };
  
  

  const handleConfirmUpdate = () => {
    if (selectedClientId && newRole) {
      updateRoleMutation.mutate({ clientId: selectedClientId, role: newRole });
      setIsModalOpen(false);
    }
  };
  

  if (isLoading) return <div>Loading...</div>;

  return (
    // <div className="bg-white shadow rounded-lg overflow-hidden">
    <div className="bg-white shadow rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
        {clients
            ?.filter((client) => {
              const query = searchQuery.toLowerCase();
              if (filterBy === 'tags') {
                if (!selectedTags || selectedTags.length === 0) return true;
                return selectedTags.every(tag => (client.tags ?? []).includes(tag));
              }

              switch (filterBy) {
                case 'email':
                  return client.email.toLowerCase().includes(query);
                case 'company':
                  return client.company?.toLowerCase().includes(query);
                case 'phone':
                  return client.phone?.toLowerCase().includes(query);
                case 'role':
                  return client.role.toLowerCase().includes(query);
                case 'name':
                default:
                  return client.name.toLowerCase().includes(query);
              }
            })
            .map((client) => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{client.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{client.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{client.company}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{client.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <CreatableSelect
                  isMulti
                  styles={customStyles}
                  value={(clientTags[client.id] ?? [])
                    .map(tagVal => availableTags.find(opt => opt.value === tagVal))
                    .filter(Boolean) as TagOption[]}
                  onChange={(selected, actionMeta) =>
                    handleTagChange(client.id, selected as MultiValue<TagOption>, actionMeta)
                  }
                  options={availableTags}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  formatCreateLabel={(inputValue) => `+ Create tag "${inputValue}"`}
                />
              </td>   
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <Select
                  value={roleOptions.find(option => option.value === client.role)}
                  onChange={(selectedOption) => handleRoleChange(client.id, selectedOption?.value || '')}
                  options={roleOptions}
                  className="basic-single"
                  classNamePrefix="select"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmDelete(client.id, client.name); // <-- opens the modal
                  }}
                  className="text-red-600 hover:text-red-900 ml-2"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmUpdate}
        title="Confirm Role Update"
        message={`Are you sure you want to update the role to "${newRole}"?`}
      />
     <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Client?"
        message={
          deleteTarget?.name
            ? `This will permanently delete ${deleteTarget.name}. This action cannot be undone.`
            : 'This will permanently delete the selected client. This action cannot be undone.'
        }
      />
    </div>
  );
};