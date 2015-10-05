import os
from metadata_helper import Metadata


def main():
    """ Main function """

    base = os.path.abspath(os.path.dirname(__file__))

    meta = Metadata('metadata.csv',
                    'http://landsat.usgs.gov/metadata_service/bulk_metadata_files/LANDSAT_8.csv',
                    base,
                    [os.getenv('ES_HOST', 'elasticsearch:9200')],
                    'landsat',
                    '8')

    meta.populate()

if __name__ == '__main__':
    main()
