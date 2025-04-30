import { useEffect, useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import { TabGroup, TabList, TabPanel, TabPanels, Tab, Combobox, Transition, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption, Listbox } from "@headlessui/react";
import { ChevronsUpDown, Check } from "lucide-react";
import fuzzysort from "fuzzysort";
import toast from "react-hot-toast";
import { Event } from "../../../../shared/types/events";
import { registrationsApi, eventsApi, leagueApi } from "../../api";
import { predictionsApi } from "../../api/predictions";
import { PodiumPrediction } from "../../../../shared/types/Prediction";
import { League } from "../../api/leagues";

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
    const [userPredictions, setUserPredictions] = useState<{ [key: number]: PodiumPrediction }>({});
    const [userLeagues, setUserLeagues] = useState<League[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
    
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

    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const leagues = await leagueApi.getMyLeagues();
                setUserLeagues(leagues.leagues);
                if (leagues.leagues.length > 0) {
                    setSelectedLeague(leagues.leagues[0]);
                }
            } catch (err) {
                console.error("Error fetching user leagues:", err);
                toast.error("Failed to fetch your leagues.");
            }
        };
        fetchLeagues();
    }, []);

    useEffect(() => {
        const fetchUserPredictions = async () => {
            if (!loading && registration.length > 0 && id && selectedLeague) {
                try {
                    const query = {
                        eventId: id,
                        leagueId: selectedLeague._id,
                    };
                    
                    const response = await predictionsApi.queryPredictions(query);
                    
                    const predictionsByCategory: { [key: number]: PodiumPrediction } = {};
                    response.predictions.forEach(prediction => {
                        predictionsByCategory[Number(prediction.categoryId)] = prediction;
                    });
                    
                    setUserPredictions(predictionsByCategory);
                    
                    const athleteSelections: { [key: number]: Athlete[] } = {};
                    
                    Object.entries(predictionsByCategory).forEach(([categoryId, prediction]) => {
                        const catId = Number(categoryId);
                        const categoryAthletes = registration.filter(athlete => 
                            athlete.d_cats.some(c => c.id === catId)
                        );
                        
                        const selectedAthletes: Athlete[] = [];
                        const { first, second, third } = prediction.data;
                        
                        if (first) {
                            const firstAthlete = categoryAthletes.find(a => a.athlete_id.toString() === first);
                            if (firstAthlete) selectedAthletes[0] = firstAthlete;
                        }
                        
                        if (second) {
                            const secondAthlete = categoryAthletes.find(a => a.athlete_id.toString() === second);
                            if (secondAthlete) selectedAthletes[1] = secondAthlete;
                        }
                        
                        if (third) {
                            const thirdAthlete = categoryAthletes.find(a => a.athlete_id.toString() === third);
                            if (thirdAthlete) selectedAthletes[2] = thirdAthlete;
                        }
                        
                        athleteSelections[catId] = selectedAthletes;
                    });
                    
                    setSelectedAthletesByCategory(athleteSelections);
                } catch (error) {
                    console.error("Error fetching user predictions:", error);
                    setUserPredictions({});
                    setSelectedAthletesByCategory({});
                }
            } else if (!selectedLeague) {
                setUserPredictions({});
                setSelectedAthletesByCategory({});
            }
        };
        
        fetchUserPredictions();
    }, [id, loading, registration, selectedLeague]);

    const handleRowClick = (categoryId: number, athlete: Athlete) => {
      setSelectedAthletesByCategory(prev => {
        const current = prev[categoryId] ? [...prev[categoryId]] : [];
        const idx = current.findIndex(a => a && a.athlete_id === athlete.athlete_id);
        if (idx !== -1) {
          current.splice(idx, 1);
        } else {
           let insertIndex = current.findIndex(slot => !slot);
           if (insertIndex === -1 && current.length < 3) {
               insertIndex = current.length;
           }

           if (insertIndex !== -1 && insertIndex < 3) {
               const alreadySelected = current.some(a => a && a.athlete_id === athlete.athlete_id);
               if (!alreadySelected) {
                    current[insertIndex] = athlete;
               } else {
                   toast.error("Athlete already selected in another position.");
               }
           } else if (current.length >= 3 && insertIndex === -1) {
               toast.error("Maximum of 3 athletes already selected.");
           }
        }
        const finalSelection = Array.from({ length: Math.max(current.length, 3) }, (_, i) => current[i] || null).slice(0, 3);
        return { ...prev, [categoryId]: finalSelection as Athlete[] };
      });
    };

    const renderTable = (categoryId: number, data: Athlete[]) => (
        <div className="relative">
            <div className="h-max md:max-h-svh md:overflow-auto">
                <table className="min-w-full">
                    <thead className="sticky top-0 bg-white">
                        <tr>
                            <th className="py-2">First Name</th>
                            <th className="py-2">Last Name</th>
                            <th className="py-2">Country</th>
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
                                <td className=" py-2">{athlete.firstname}</td>
                                <td className="px-1 py-2">{athlete.lastname}</td>
                                <td className=" py-2">{athlete.country}</td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const isCategoryFinished = (categoryId: number) => {
        if (!event || !event.dcats || event.dcats.length === 0) return false;
        const category = event.dcats.find(cat => cat.dcat_id === categoryId);
        return category?.status === "finished" || category?.status === "completed";
    };

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
        <div className="h-full md:h-auto overflow-y-auto">
            <h1 className="text-2xl font-bold">{event?.name}</h1>

            {userLeagues.length > 0 && (
                <div className="mb-4 max-w-xs">
                     <Listbox value={selectedLeague} onChange={setSelectedLeague}>
                         <div className="relative mt-1">
                         <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                             <span className="block truncate">{selectedLeague ? selectedLeague.name : "Select a League"}</span>
                             <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                             <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                             </span>
                         </Listbox.Button>
                         <Transition
                             as={Fragment}
                             leave="transition ease-in duration-100"
                             leaveFrom="opacity-100"
                             leaveTo="opacity-0"
                         >
                             <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                             {userLeagues.map((league) => (
                                 <Listbox.Option
                                 key={league._id}
                                 className={({ active }) =>
                                     `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                     active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                                     }`
                                 }
                                 value={league}
                                 >
                                 {({ selected }) => (
                                     <>
                                     <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                         {league.name}
                                     </span>
                                     {selected ? (
                                         <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                         <Check className="h-5 w-5" aria-hidden="true" />
                                         </span>
                                     ) : null}
                                     </>
                                 )}
                                 </Listbox.Option>
                             ))}
                             </Listbox.Options>
                         </Transition>
                         </div>
                     </Listbox>
                 </div>
            )}
            {userLeagues.length === 0 && !loading && (
                 <p className="text-red-500 mb-4">You are not part of any leagues. Cannot make predictions.</p>
            )}

            {categories.length > 0 && selectedLeague ? (
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
                                {cat.name} {userPredictions[cat.id] ? '✓' : ''} {isCategoryFinished(cat.id) && '🔒'}
                            </Tab>
                        ))}
                    </TabList>
                    <TabPanels className="mt-2">
                        {categories.map((cat) => {
                            const filteredAthletes = registration.filter(
                                (athlete) =>
                                    athlete.d_cats.some((c) => c.id === cat.id)
                            );
                            const existingPrediction = userPredictions[cat.id];
                            return (
                                <TabPanel
                                    key={`${selectedLeague?._id}-${cat.id}`}
                                    className="h-fit rounded-xl bg-white p-3 grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    <div className="order-2 md:order-1 h-max md:h-auto">
                                        <h2 className="text-lg font-medium mb-2">Available Athletes</h2>
                                        {filteredAthletes.length > 0 ? (
                                            renderTable(cat.id, filteredAthletes)
                                        ) : (
                                            <p>No registrations found for this category.</p>
                                        )}
                                    </div>

                                    <div className="mt-2 order-1 md:order-2">
                                        <h2 className="text-lg font-medium">Select Podium</h2>
                                        {existingPrediction && (
                                            <p className="text-sm text-green-600 mb-2">
                                                You have already predicted for this category in <span className="font-semibold">{selectedLeague?.name}</span>.
                                            </p>
                                        )}
                                        {!existingPrediction && (
                                            <p className="text-sm text-gray-500 mb-2">
                                                Predicting for <span className="font-semibold">{selectedLeague?.name}</span>.
                                            </p>
                                        )}
                                        {isCategoryFinished(cat.id) && (
                                            <p className="text-sm text-red-500 mb-2 font-bold">
                                                This category has finished. No new predictions allowed.
                                            </p>
                                        )}

                                        {[0, 1, 2].map((index) => {
                                            const query = searchByCategory[cat.id]?.[index] || "";
                                            const options = query
                                                ? fuzzysort
                                                      .go(query, filteredAthletes, { key: "name" })
                                                      .map(result => result.obj)
                                                : filteredAthletes;

                                            const currentSelectionForIndex = (selectedAthletesByCategory[cat.id] && selectedAthletesByCategory[cat.id].length > index)
                                                ? selectedAthletesByCategory[cat.id][index]
                                                : null;

                                            return (
                                                <div key={index} className="mt-2">
                                                    <p className="text-sm font-medium">{medals[index]} Athlete {index + 1}</p>
                                                    <Combobox
                                                        value={currentSelectionForIndex}
                                                        onChange={(selected: Athlete | null) => {
                                                            setSelectedAthletesByCategory(prev => {
                                                                const currentSelections = prev[cat.id] ? [...prev[cat.id]] : Array(3).fill(null);
                                                                if (selected && currentSelections.some((a, i) => a && a.athlete_id === selected.athlete_id && i !== index)) {
                                                                    toast.error("Athlete already selected in another position.");
                                                                    return prev;
                                                                }

                                                                currentSelections[index] = selected;

                                                                const finalSelections = Array.from({ length: 3 }, (_, i) => currentSelections[i] || null);

                                                                return { ...prev, [cat.id]: finalSelections as Athlete[] };
                                                            });
                                                        }}
                                                        nullable
                                                    >
                                                        <div className="relative mt-1">
                                                            <ComboboxInput
                                                              className="w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none sm:text-sm"
                                                              displayValue={(athlete: Athlete | null) => athlete ? `${athlete.firstname} ${athlete.lastname}` : ''}
                                                              placeholder="Select athlete"
                                                              onChange={e => {
                                                                const val = (e.target as HTMLInputElement).value;
                                                                setSearchByCategory(prev => {
                                                                    const catSearches = prev[cat.id] ? [...prev[cat.id]] : [];
                                                                    catSearches[index] = val;
                                                                    return { ...prev, [cat.id]: catSearches };
                                                                });
                                                              }}
                                                            />
                                                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2" >
                                                              <ChevronsUpDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                            </ComboboxButton>
                                                            {options.length > 0 && (
                                                                <Transition
                                                                    as={Fragment}
                                                                    leave="transition ease-in duration-100"
                                                                    leaveFrom="opacity-100"
                                                                    leaveTo="opacity-0"
                                                                    afterLeave={() => setSearchByCategory(prev => ({ ...prev, [cat.id]: [] }))}
                                                                >
                                                                    <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                                        {options.map((athlete) => (
                                                                            <ComboboxOption
                                                                                key={athlete.athlete_id}
                                                                                className={({ active }) =>
                                                                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'}`
                                                                                }
                                                                                value={athlete}
                                                                                disabled={selectedAthletesByCategory[cat.id]?.some((a, i) => a && a.athlete_id === athlete.athlete_id && i !== index)}
                                                                            >
                                                                                {({ selected, active, disabled }) => (
                                                                                    <>
                                                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'} ${disabled ? 'text-gray-400' : ''}`}>
                                                                                            {athlete.name}
                                                                                        </span>
                                                                                        {selected && !disabled && (
                                                                                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-amber-600' : 'text-teal-600'}`}>
                                                                                                <Check className="h-5 w-5" aria-hidden="true" />
                                                                                            </span>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </ComboboxOption>
                                                                        ))}
                                                                    </ComboboxOptions>
                                                                </Transition>
                                                            )}
                                                        </div>
                                                    </Combobox>
                                                </div>
                                            );
                                        })}
                                        <button
                                            className={`mt-4 rounded px-4 py-2 text-white ${
                                                !selectedLeague ? 'bg-gray-400 cursor-not-allowed' : 
                                                isCategoryFinished(cat.id) ? 'bg-red-400 cursor-not-allowed' : 
                                                'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                            disabled={!selectedLeague || isCategoryFinished(cat.id)}
                                            onClick={async () => {
                                                if (!selectedLeague) {
                                                     toast.error("Please select a league first.");
                                                     return;
                                                }
                                                
                                                if (isCategoryFinished(cat.id)) {
                                                    toast.error("This category has already finished. No new predictions allowed.");
                                                    return;
                                                }
                                                
                                                const selection = (selectedAthletesByCategory[cat.id] || []).filter(a => a);
                                                if (selection.length === 0) {
                                                    toast.error("Please select at least one athlete");
                                                    return;
                                                }

                                                let loadingToast: string | undefined;
                                                try {
                                                    loadingToast = toast.loading(existingPrediction ? "Updating prediction..." : "Submitting prediction...");

                                                    const first = selectedAthletesByCategory[cat.id]?.[0]?.athlete_id.toString() || "";
                                                    const second = selectedAthletesByCategory[cat.id]?.[1]?.athlete_id.toString() || "";
                                                    const third = selectedAthletesByCategory[cat.id]?.[2]?.athlete_id.toString() || "";

                                                    const predictionPayload = {
                                                        eventId: id as string,
                                                        categoryId: cat.id.toString(),
                                                        categoryName: cat.name,
                                                        leagueId: selectedLeague._id,
                                                        userId: "",
                                                        type: "podium" as const,
                                                        locked: false,
                                                        event_finished: false,
                                                        scoreDetails: undefined,
                                                        totalPoints: 0,
                                                        data: { first, second, third }
                                                    };

                                                    let response;
                                                    if (existingPrediction) {
                                                        response = await predictionsApi.updatePrediction(
                                                            existingPrediction._id as string,
                                                            { data: predictionPayload.data }
                                                        );
                                                    } else {
                                                        response = await predictionsApi.createPrediction(predictionPayload);
                                                    }

                                                    toast.dismiss(loadingToast);

                                                    if (response.success) {
                                                        toast.success(existingPrediction ? "Prediction updated!" : "Prediction submitted!");

                                                        if (!existingPrediction && 'predictionId' in response) {
                                                            setUserPredictions(prev => ({
                                                                ...prev,
                                                                [cat.id]: {
                                                                    ...predictionPayload,
                                                                    _id: response.predictionId,
                                                                } as PodiumPrediction
                                                            }));
                                                        } else if (existingPrediction) {
                                                             setUserPredictions(prev => ({
                                                                ...prev,
                                                                [cat.id]: {
                                                                    ...existingPrediction,
                                                                    data: predictionPayload.data
                                                                }
                                                            }));
                                                        }
                                                    } else {
                                                        toast.error(response.error || "Failed to submit prediction");
                                                    }
                                                } catch (err) {
                                                     toast.error(err instanceof Error ? err.message : "An error occurred");
                                                     if (loadingToast) toast.dismiss(loadingToast);
                                                }
                                            }}
                                        >
                                            {existingPrediction ? "Update Selection" : "Submit Selection"}
                                        </button>
                                    </div>
                                </TabPanel>
                            );
                        })}
                    </TabPanels>
                </TabGroup>
            ) : (
                 !selectedLeague && userLeagues.length > 0 ? <p>Please select a league to make predictions.</p> : <p>No categories found for this event.</p>
            )}
        </div>
    );
};

export default Upcoming;
