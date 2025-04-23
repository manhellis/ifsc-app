import { useEffect, useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import { TabGroup, TabList, TabPanel, TabPanels, Tab, Combobox, Transition, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from "@headlessui/react";
import { ChevronsUpDown, Check } from "lucide-react";
import fuzzysort from "fuzzysort";
import toast from "react-hot-toast";
import { Event } from "../../../../shared/types/events";
import { registrationsApi, eventsApi } from "../../api";
import { predictionsApi } from "../../api/predictions";

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
    const [searchByCategory, setSearchByCategory] = useState<{ [key: number]: string[] }>({});
    const [event, setEvent] = useState<Event | null>(null);
    useEffect(() => {
        const fetchRegistration = async () => {
            try {
                if (id) {
                    const data = await registrationsApi.fetchUpcomingRegistrations(id);
                    setRegistration(data);
                }
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

    useEffect(() => {
        const fetchEvent = async () => {
            if (id) {
                const data = await eventsApi.fetchEventById(id);
                setEvent(data.event);
            }
        };
        fetchEvent();
    }, [id]);

    // Handle clicking on a table row to select/deselect athletes
    const handleRowClick = (categoryId: number, athlete: Athlete) => {
      setSelectedAthletesByCategory(prev => {
        const current = prev[categoryId] ? [...prev[categoryId]] : [];
        const idx = current.findIndex(a => a.athlete_id === athlete.athlete_id);
        if (idx !== -1) {
          // Deselect if already selected
          current.splice(idx, 1);
        } else if (current.length < 3) {
          // Select into next open slot
          current.push(athlete);
        }
        return { ...prev, [categoryId]: current };
      });
    };

    const renderTable = (categoryId: number, data: Athlete[]) => (
        <div className="relative">
            <div className="max-h-svh overflow-auto">
                <table className="min-w-full">
                    <thead className="sticky top-0 bg-white">
                        <tr>
                            {/* <th className="px-4 py-2">Athlete ID</th> */}
                            <th className="py-2">First Name</th>
                            <th className="py-2">Last Name</th>
                            {/* <th className="px-4 py-2">Name</th> */}
                            {/* <th className="px-4 py-2">Gender</th> */}
                            {/* <th className="px-4 py-2">Federation</th> */}
                            <th className="py-2">Country</th>
                            {/* <th className="px-4 py-2">Categories</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((athlete) => {
                            const isSelected = selectedAthletesByCategory[categoryId]?.some(a => a && a.athlete_id === athlete.athlete_id);
                            return (
                            <tr
                              key={athlete.athlete_id}
                              className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-100 border-2 border-blue-100' : ''}`}
                              onClick={() => handleRowClick(categoryId, athlete)}
                            >
                                {/* <td className="px-4 py-2">{athlete.athlete_id}</td> */}
                                <td className=" py-2">{athlete.firstname}</td>
                                <td className="px-1 py-2">{athlete.lastname}</td>
                                {/* <td className="px-4 py-2">{athlete.name}</td> */}
                                {/* <td className="px-4 py-2">{athlete.gender === 1 ? "Female" : "Male"}</td> */}
                                {/* <td className="px-4 py-2">{athlete.federation}</td> */}
                                <td className=" py-2">{athlete.country}</td>
                                {/* <td className="px-4 py-2">
                                    {athlete.d_cats
                                        .map((cat) => cat.name)
                                        .join(", ")}
                                </td> */}
                            </tr>
                            );
                        })}
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
    const medals = ["🥇", "🥈", "🥉"];
    return (
        <div className="">
            <h1 className="text-2xl font-bold">{event?.name}</h1>
            {categories.length > 0 ? (
                <TabGroup defaultIndex={defaultIndex !== -1 ? defaultIndex : 0}>
                    <TabList className="flex space-x-1 rounded-xl bg-gray-400/40 p-1">
                        {categories.map((cat) => (
                            <Tab
                                key={cat.id}
                                className={({ selected }) =>
                                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-black ${
                                        selected
                                            ? "bg-white shadow"
                                            : "text-gray-600 hover:bg-white/[0.12] hover:text-white"
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
                                    className="rounded-xl bg-white p-3  grid grid-cols-2"
                                >
                                    {filteredAthletes.length > 0 ? (
                                        renderTable(cat.id, filteredAthletes)
                                    ) : (
                                        <p>
                                            No registrations found for this
                                            category.
                                        </p>
                                    )}
                                    <div className="mt-2">
                                      <div className="mt-4">
                                        <h2 className="text-lg font-medium">Select up to three athletes</h2>
                                            {[0, 1, 2].map((index) => {
                                                // prepare fuzzy search for this category/index
                                                const query = searchByCategory[cat.id]?.[index] || "";
                                                const options = query
                                                    ? fuzzysort
                                                          .go(query, filteredAthletes, { key: "name" })
                                                          .map(result => result.obj)
                                                    : filteredAthletes;
                                                return (
                                                <div key={index} className="mt-2">
                                            <p className="text-sm font-medium">{medals[index]} Athlete {index + 1}</p>
                                            <Combobox
                                              value={(selectedAthletesByCategory[cat.id] && selectedAthletesByCategory[cat.id][index]) || null}
                                              onChange={(selected: Athlete | null) => {
                                                setSelectedAthletesByCategory(prev => {
                                                  const currentSelections = prev[cat.id] ? [...prev[cat.id]] : [];
                                                  if (selected) {
                                                    // assign if a valid athlete
                                                    currentSelections[index] = selected;
                                                  } else {
                                                    // remove selection if null
                                                    currentSelections.splice(index, 1);
                                                  }
                                                  return { ...prev, [cat.id]: currentSelections };
                                                });
                                              }}
                                            >
                                              <div className="relative mt-1">
                                                <ComboboxInput
                                                  className="w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none sm:text-sm"
                                                  displayValue={(athlete: Athlete) => athlete ? `${athlete.firstname} ${athlete.lastname}` : ''}
                                                  placeholder="Select athlete"
                                                  onChange={e => {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    // update query for this category and index
                                                    setSearchByCategory(prev => {
                                                      const arr = prev[cat.id] ? [...prev[cat.id]] : [];
                                                      arr[index] = val;
                                                      return { ...prev, [cat.id]: arr };
                                                    });
                                                  }}
                                                />
                                                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2" >
                                                  <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </ComboboxButton>
                                                <Transition
                                                  as={Fragment}
                                                  leave="transition ease-in duration-100"
                                                  leaveFrom="opacity-100"
                                                  leaveTo="opacity-0"
                                                >
                                                  <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                            {options.map((athlete) => (
                                                      <ComboboxOption
                                                        key={athlete.athlete_id}
                                                        className={({ active }) =>
                                                          `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'}`
                                                        }
                                                        value={athlete}
                                                      >
                                                        {({ selected }) => (
                                                          <>
                                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{athlete.name}</span>
                                                            {selected && (
                                                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                                                <Check className="h-5 w-5" aria-hidden="true" />
                                                              </span>
                                                            )}
                                                          </>
                                                        )}
                                                      </ComboboxOption>
                                                    ))}
                                                  </ComboboxOptions>
                                                </Transition>
                                              </div>
                                            </Combobox>
                                          </div>
                                        );
                                      })}
                                        <button
                                          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
                                          onClick={async () => {
                                            const selection = selectedAthletesByCategory[cat.id] || [];
                                            if (selection.length === 0) {
                                              toast.error("Please select at least one athlete");
                                              return;
                                            }

                                            try {
                                              const loadingToast = toast.loading("Submitting prediction...");
                                              
                                              // Get IDs for first, second, and third positions
                                              const first = selection[0]?.athlete_id.toString() || "";
                                              const second = selection[1]?.athlete_id.toString() || "";
                                              const third = selection[2]?.athlete_id.toString() || "";
                                              
                                              // Create prediction payload
                                              const prediction = {
                                                eventId: id as string,
                                                categoryId: cat.id,
                                                categoryName: cat.name,
                                                leagueId: String(event?.league_id || ""),
                                                userId: "", // This will be populated on the server from auth
                                                type: "podium" as const,
                                                locked: false,
                                                data: {
                                                  first,
                                                  second, 
                                                  third
                                                }
                                              };
                                              
                                              const response = await predictionsApi.createPrediction(prediction);
                                              
                                              toast.dismiss(loadingToast);
                                              
                                              if (response.success) {
                                                toast.success("Prediction submitted successfully!");
                                                // Clear selection after successful submission
                                                setSelectedAthletesByCategory(prev => ({
                                                  ...prev,
                                                  [cat.id]: []
                                                }));
                                              } else {
                                                toast.error(response.error || "Failed to submit prediction");
                                              }
                                            } catch (error) {
                                              toast.error(error instanceof Error ? error.message : "An error occurred");
                                            }
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
