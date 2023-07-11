# Import dependencies
from flask import Flask, render_template, jsonify
from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

Base = declarative_base()

# Base class
class Data(Base):
    __tablename__ = 'data'
    Country = Column(String(512), primary_key=True)
    New_cases = Column(Integer)
    Cumulative_cases = Column(Integer)
    New_deaths = Column(Integer)
    Cumulative_deaths = Column(Integer)
    Latitude = Column(Float)
    Longitude = Column(Float)

# Engine and the session
engine = create_engine('sqlite:///covid.db')
Base.metadata.bind = engine
DBSession = sessionmaker(bind=engine)
session = DBSession()

app = Flask(__name__)

# Home page
@app.route("/")
def home():
    return render_template('index.html')

@app.route("/")
def welcome():
    return (
        f"Available Routes:<br/>"
        f"/api/covid<br/>"
        
    )

# Route for our data
@app.route("/api/covid")
def covid():
    results = session.query(Data).all()
    session.close()

    # Loading data in geoJSON format
    geojson_data = {
        "type": "FeatureCollection",
        "features": []
    }

    for idx, result in enumerate(results):
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [result.Longitude, result.Latitude]
            },
            "properties": {
                "Country": result.Country,
                "New_cases": result.New_cases,
                "Cumulative_cases": result.Cumulative_cases,
                "New_deaths": result.New_deaths,
                "Cumulative_deaths": result.Cumulative_deaths
            }
        }

        geojson_data["features"].append(feature)

    return jsonify(geojson_data)

# Run app
if __name__ == '__main__':
    app.run()
