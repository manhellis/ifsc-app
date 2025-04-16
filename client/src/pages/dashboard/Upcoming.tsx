import { useEffect, useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import { ListboxOption, Tab } from "@headlessui/react";
import { TabGroup, TabList, TabPanel, TabPanels, Listbox, Transition, ListboxButton, ListboxOptions, } from "@headlessui/react";
import { ChevronsUpDown, Check } from "lucide-react";

interface Category {
    id: number;
    name: string;
}

interface Athlete {
    athlete_id: number;
    firstname: string;
    lastname: string;
    name: string;
    gender: number;
    federation: string;
    federation_id: number;
    country: string;
    d_cats: Category[];
}

const Upcoming = () => {
    const { id, cid } = useParams<{ id: string; cid: string }>();
    const [registration, setRegistration] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [selectedAthletesByCategory, setSelectedAthletesByCategory] = useState<{ [key: number]: Athlete[] }>({});

    useEffect(() => {
        const fetchRegistration = async () => {
            try {
                const response = await fetch(`/api/upcoming/${id}`);
                const data = await response.json();
                setRegistration(data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error
                        : new Error("An error occurred")
                );
            } finally {
                setLoading(false);
            }
        };
        fetchRegistration();
    }, [id]);

    const renderTable = (data: Athlete[]) => (
        <div className="relative">
            <div className="max-h-svh overflow-auto">
                <table className="min-w-full">
                    <thead className="sticky top-0 bg-white">
                        <tr>
                            <th className="px-4 py-2">Athlete ID</th>
                            <th className="px-4 py-2">First Name</th>
                            <th className="px-4 py-2">Last Name</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Gender</th>
                            <th className="px-4 py-2">Federation</th>
                            <th className="px-4 py-2">Country</th>
                            <th className="px-4 py-2">Categories</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((athlete) => (
                            <tr key={athlete.athlete_id} className="hover:bg-gray-50">
                                <td className="px-4 py-2">{athlete.athlete_id}</td>
                                <td className="px-4 py-2">{athlete.firstname}</td>
                                <td className="px-4 py-2">{athlete.lastname}</td>
                                <td className="px-4 py-2">{athlete.name}</td>
                                <td className="px-4 py-2">{athlete.gender === 1 ? "Female" : "Male"}</td>
                                <td className="px-4 py-2">{athlete.federation}</td>
                                <td className="px-4 py-2">{athlete.country}</td>
                                <td className="px-4 py-2">
                                    {athlete.d_cats
                                        .map((cat) => cat.name)
                                        .join(", ")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    const categories: Category[] = Array.from(
        new Map(
            registration.flatMap((athlete) =>
                athlete.d_cats.map((cat) => [cat.id, cat])
            )
        ).values()
    );

    const defaultIndex = cid ? categories.findIndex(cat => cat.id.toString() === cid) : 0;

    return (
        <div className="">
            <h1>Upcoming Registrations</h1>
            {categories.length > 0 ? (
                <TabGroup defaultIndex={defaultIndex !== -1 ? defaultIndex : 0}>
                    <TabList className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                        {categories.map((cat) => (
                            <Tab
                                key={cat.id}
                                className={({ selected }) =>
                                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ${
                                        selected
                                            ? "bg-white shadow"
                                            : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                                    }`
                                }
                            >
                                {cat.name}
                            </Tab>
                        ))}
                    </TabList>
                    <TabPanels className="mt-2">
                        {categories.map((cat) => {
                            const filteredAthletes = registration.filter(
                                (athlete) =>
                                    athlete.d_cats.some((c) => c.id === cat.id)
                            );
                            return (
                                <TabPanel
                                    key={cat.id}
                                    className="rounded-xl bg-white p-3 flex flex-row grid grid-cols-2"
                                >
                                    {filteredAthletes.length > 0 ? (
                                        renderTable(filteredAthletes)
                                    ) : (
                                        <p>
                                            No registrations found for this
                                            category.
                                        </p>
                                    )}
                                    <div className="mt-2">
                                        <div className="mt-4">
                                            <h2 className="text-lg font-medium">Select up to three athletes</h2>
                                            {[0, 1, 2].map((index) => (
                                              <div key={index} className="mt-2">
                                                <p className="text-sm font-medium">Athlete {index + 1}</p>
                                                <Listbox
                                                  value={(selectedAthletesByCategory[cat.id] && selectedAthletesByCategory[cat.id][index]) || null}
                                                  onChange={(selected: Athlete) => {
                                                    const currentSelections = selectedAthletesByCategory[cat.id] ? [...selectedAthletesByCategory[cat.id]] : [];
                                                    currentSelections[index] = selected;
                                                    setSelectedAthletesByCategory(prev => ({
                                                      ...prev,
                                                      [cat.id]: currentSelections
                                                    }));
                                                  }}
                                                >
                                                  {({ open }: { open: boolean }) => (
                                                    <>
                                                      <div className="relative mt-1">
                                                        <ListboxButton className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none sm:text-sm">
                                                          <span className="block truncate">
                                                            {(selectedAthletesByCategory[cat.id] && selectedAthletesByCategory[cat.id][index])
                                                              ? selectedAthletesByCategory[cat.id][index].name
                                                              : 'Select athlete'}
                                                          </span>
                                                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                            <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                          </span>
                                                        </ListboxButton>
                                                        <Transition
                                                          show={open}
                                                          as={Fragment}
                                                          leave="transition ease-in duration-100"
                                                          leaveFrom="opacity-100"
                                                          leaveTo="opacity-0"
                                                        >
                                                          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                            {filteredAthletes.map((athlete) => (
                                                              <ListboxOption
                                                                key={athlete.athlete_id}
                                                                className={({ active }: { active: boolean }) =>
                                                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'}`
                                                                }
                                                                value={athlete}
                                                              >
                                                                {({ selected }: { selected: boolean }) => (
                                                                  <>
                                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                      {athlete.name}
                                                                    </span>
                                                                    {selected ? (
                                                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                                                        <Check className="h-5 w-5" aria-hidden="true" />
                                                                      </span>
                                                                    ) : null}
                                                                  </>
                                                                )}
                                                              </ListboxOption>
                                                            ))}
                                                          </ListboxOptions>
                                                        </Transition>
                                                      </div>
                                                    </>
                                                  )}
                                                </Listbox>
                                              </div>
                                            ))}
                                            <button
                                              className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
                                              onClick={() => {
                                                const selection = selectedAthletesByCategory[cat.id] || [];
                                                console.log("Submitting selected athletes for category", cat.name, selection);
                                                // Add your submission function call here
                                              }}
                                            >
                                              Submit Selection
                                            </button>
                                        </div>
                                    </div>
                                </TabPanel>
                            );
                        })}
                    </TabPanels>
                </TabGroup>
            ) : (
                <p>No categories found.</p>
            )}
        </div>
    );
};

export default Upcoming;
