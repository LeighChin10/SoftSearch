class MapsController < ApplicationController
    skip_before_action :verify_authenticity_token

    def show 
        puts "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!#{ENV["MAPBOX_KEY"]}"
        location = params['location']
        coords = [-80.1918,25.7617]

        if(location == "GET_ALL")
            @jobs = { job_data: Job.append_skills(Job.all), coords: [-98.5795,39.8283] }
        else
            @jobs = geoCode(location)
        end
    end

    def jobs
        location = params['location']
        respond_to do |format|
            format.json do
                if(location == 'GET_ALL')
                    render json: { job_data: Job.append_skills(Job.all), coords: [-98.5795,39.8283] }
                else
                    render json: geoCode(location)
                end
            end
        end
    end

    private 
    
    def geoCode(location)
        coords = Geocoder.search("#{location}")
        if coords.first
            @coords = coords.first.coordinates.reverse
            jobs = Job.all.select { |job| Job.calc_dist(@coords[0],@coords[1],job.longitude,job.latitude) <= 100 }
            @jobs = Job.append_skills(jobs)
            { job_data: @jobs, coords: @coords }
        else
            redirect_to root_path
        end
    end
end 