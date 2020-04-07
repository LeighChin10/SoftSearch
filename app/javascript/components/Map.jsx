import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Jobs from './Jobs'
import Pagination from './Pagination'

import JobPic from '../../assets/images/job.png'
import SearchPin from '../../assets/images/search.png'
import { 
    allJobsOption,
    pointFeature, options,
    geoJsonMarkers,
    geoLocationOptions,
    createLayers,
    SEARCH_LAYER
} from './mapFunctions'

const style = {
    width: "100rem",
    height: "100vh"
}

const Map = ({ API_KEY, jobs, all_skills, userID }) => {
    const [filteredJobs, setFilteredJobs] = useState([])
    const [apiJobs, setApiJobs] = useState([])
    const [visibleSkills, setVisibleSkills] = useState(Object.keys(jobs.job_data[1]))
    const [map, setMap] = useState({})
    const [currentSkills, setCurrentSkills] = useState(Object.keys(jobs.job_data[1]))  // array of current skills in jobs
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')    
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [jobsPerPage] = useState(5)
    // get current jobs 
    const indexOfLastJob = currentPage * jobsPerPage
    const indexOfFirstJob = indexOfLastJob - jobsPerPage
    console.log("INSIDE MAP COMPONENT",API_KEY)
    const currentJobs = filteredJobs.slice(indexOfFirstJob,indexOfLastJob)
    const paginate = pageNumber => setCurrentPage(pageNumber)

    useEffect(() => {
        mapboxgl.accessToken = API_KEY;
        if(jobs.coords[0] === -98.5795 && jobs.coords[1] === 39.8283) {
            createMap(allJobsOption)
        } else {
            createMap(options(jobs.coords))
        }
        return () => {
            map.remove()
        }
    },[])

    console.log(userID)

    useEffect(() => {
        if(!query) return
        fetchJobData()
    },[query])

    useEffect(() => {
        if(!filteredJobs.length) return
        setLoading(false)
    },[filteredJobs])

    useEffect(() => {
        if(apiJobs.job_data) {
            setCurrentPage(1)
            setVisibleSkills(Object.keys(apiJobs.job_data[1]))
            const filteredPoints = geoJsonMarkers(apiJobs.job_data[0])
            setCurrentSkills(Object.keys(apiJobs.job_data[1]))
            setLoading(true)
            setFilteredJobs(filteredPoints.features)
            createLayers(map,apiJobs.job_data[1],all_skills)
            map.getSource('search').setData(pointFeature(apiJobs.coords)) 
            map.flyTo({center: apiJobs.coords, speed: 0.5,
                zoom: (query === "GET_ALL" || query === "" ? 4 : 6 )})
        }
    },[apiJobs])

    function createMap(mapOptions) {
        const map = new mapboxgl.Map(mapOptions)
        const filteredPoints = geoJsonMarkers(jobs.job_data[0]).features   
        setLoading(true)
        setFilteredJobs(filteredPoints)
        map.on('load', () => {
            map.loadImage(JobPic, (error, image) => {
                if (error) throw error
                map.addImage('JobPic', image)
            })
            createLayers(map,jobs.job_data[1],all_skills)
            map.loadImage(SearchPin, (error, image) => {
                if (error) throw error
                map.addImage('SearchPin', image)
            })
            map.addSource('search', {type: 'geojson', data:    {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: jobs.coords
                },
                properties: {foo: 'bar'}
            }})
            map.addLayer(SEARCH_LAYER)
    
        })
        map.addControl(new mapboxgl.GeolocateControl(geoLocationOptions))
        map.addControl(new MapboxDirections({accessToken: API_KEY}),'top-left')
        // map.on('click','markers', e => console.log(e.features[0].properties))
        setMap( map )
    }

    function skillFilter({ target }) {
        const [ newVisibility, newVisibleSkills ] = visibleSkills.includes(target.name) ?
        ['none', visibleSkills.filter( skill => skill !== target.name)] :
        ['visible', [...visibleSkills, target.name]]
        map.setLayoutProperty(target.name, 'visibility', newVisibility)
        setVisibleSkills(newVisibleSkills)
        
        const filteredPoints = (apiJobs.job_data ? 
            geoJsonMarkers(apiJobs.job_data[0]).features :
            geoJsonMarkers(jobs.job_data[0]).features) 
        const currentVisibleJobs = filteredPoints.filter( 
            ({ properties: { skills } }) => ( skills.some( ({ name }) => (
                newVisibleSkills.includes(name)))))
        setFilteredJobs(currentVisibleJobs)
    }

    function showNoSkills() {
        visibleSkills.forEach( skill => {
            map.setLayoutProperty(skill, 'visibility', 'none')
        })
        setVisibleSkills([])
        setFilteredJobs([])
    }

    function showAllSkills() {
        currentSkills.forEach( skill => {
            map.setLayoutProperty(skill, 'visibility', 'visible')
        })
        setVisibleSkills(currentSkills)
        const filteredPoints = (apiJobs.job_data ? 
        geoJsonMarkers(apiJobs.job_data[0]).features :
        geoJsonMarkers(jobs.job_data[0]).features) 
        setFilteredJobs(filteredPoints)
    }

    const fetchJobData = async () => {
        const response = await axios.get(`/map/jobs.json?location=${query}`)
        setApiJobs(response.data)
    } 

    return(
        <>                        
            <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}> 
                <button style={{marginBottom:'5rem'}} onClick={() => setQuery('GET_ALL')}>SEE ALL JOBS</button>
            </div>
            <div id="skills">
            {currentSkills.length ? (
                    <div>
                        <button className='banner_input-button' onClick={showAllSkills}>Show all</button>
                        <button className='banner_input-button' onClick={showNoSkills}>Show none</button>
                    </div>  ) : null
                }
                <div>
                    {currentSkills.map( (name,index) => (
                        <button id="skill-button" className={`btn btn-md u-btn-outline-primary g-mr-10 g-mb-15 ${visibleSkills.includes(name) ? 'active':"inactive"}`} 
                        name={name} key={index} onClick={skillFilter}>{visibleSkills.includes(name) ? '-':"+"}{name}</button>))
                    }
                </div>
            </div>
            <div id='map-and-listings'>
                <div id="listings-and-page-numbers">
                    <form id="map-search-bar" className="form-inline mr-auto" style={{marginBottom:'1rem'}}  onSubmit={e => { e.preventDefault()
                                                                        setQuery(search)  }}>
                        <input id="map-search-input" className="form-control mr-sm-2" type="text" name={query} onChange={e => setSearch(e.target.value)}/>
                        <input className='banner_input-button' type="submit"/>
                    </form>
                    <Jobs userID={userID} jobs={currentJobs} loading={loading} />

                    {/* <Pagination jobsPerPage={jobsPerPage} totalJobs={filteredJobs.length} paginate={paginate} /> */}
                </div>
                <div id='map' style={style}></div>
            </div>
            <Pagination jobsPerPage={jobsPerPage} totalJobs={filteredJobs.length} paginate={paginate} />
        </>
    )
}

export default Map
