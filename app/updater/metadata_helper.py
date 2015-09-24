# USGS Landsat Imagery Util
#
#
# Author: developmentseed
# Contributer: scisco, KAPPS-
#
# License: CC0 1.0 Universal

#
# This module is intended to populate an Elastic Search instance.

from __future__ import print_function

import time
import os
import sys
import json
from urllib2 import urlopen, HTTPError, URLError


from elasticsearch import Elasticsearch
from elasticsearch.exceptions import ConnectionError


class Metadata(object):

    def __init__(self, filename, url, directory, es_url, es_main_index, es_main_type):
        self.l8_metadata_filename = filename
        self.l8_metadata_url = url
        self.assests_dir = directory
        self.es_url = es_url
        self.es_main_index = es_main_index
        self.es_main_type = es_main_type

    def populate(self):
        if self.download():
            es = Elasticsearch(self.es_url)

            f = open('%s/%s' % (self.assests_dir, self.l8_metadata_filename),
                     'r')

            # Read the first line for all the headers
            headers = f.readline().split(',')

            # Read the rest of the document
            rows = f.readlines()
            added_counter = 0
            skipped_counter = 0
            for row in rows:
                fields = row.split(',')
                obj = {}
                for header in headers:
                    try:
                        obj[header.replace('\n', '')] = float(fields[
                            headers.index(header)].replace('\n', ''))
                    except ValueError:
                        obj[header.replace('\n', '')] = fields[
                            headers.index(header)].replace('\n', '')
                try:
                    if not es.exists(
                            index=self.es_main_index,
                            doc_type=self.es_main_type,
                            id=obj['sceneID']):
                        es.create(
                            index=self.es_main_index,
                            doc_type=self.es_main_type,
                            id=obj['sceneID'],
                            body=json.dumps(obj),
                            ignore=409)
                        # print('%s-%s created' % (counter, obj['sceneID']))
                        added_counter += 1

                    else:
                        skipped_counter += 1

                    print('%s added | %s skipped' % (added_counter, skipped_counter), end='\r')

                except ConnectionError:
                    print('There was a connection error. Check your Elastic' +
                          ' Search setting and make sure Elastic Search is' +
                          'running.')
                    return False
                except:
                    print('An expected error: %s' % (sys.exc_info()[0]))
                    return False

            print('The update is completed. %s new records were added.' %
                  added_counter)

            return True

    def download(self):

        # Open the url
        try:

            # Skip if file is downloaded in the last 24 hours
            meta_file = os.path.join(self.assests_dir, self.l8_metadata_filename)
            if os.path.isfile(meta_file):
                mtime = os.path.getmtime(meta_file)
                if time.time() - mtime < (24 * 60 * 60):
                    return True

            f = urlopen(self.l8_metadata_url)
            if self.file_is_csv(f):
                print("downloading " + self.l8_metadata_url)
                CHUNK = 800 * 1024

                counter = 0
                total_size = self.get_url_file_size(f)
                # Open our local file for writing
                with open('%s/%s' % (self.assests_dir,
                                     self.l8_metadata_filename),
                          "wb") as meta_file:
                    while True:
                        chunk = f.read(CHUNK)
                        if not chunk:
                            break

                        meta_file.write(chunk)
                        counter += 1
                        chunk_sum = float(counter * CHUNK)
                        if total_size:
                            perct = chunk_sum / total_size
                        else:
                            perct = 0
                        print('==> download progress: {:.2%}'.format(perct),
                              end='\r')
                        sys.stdout.flush()

                print('==> Download completed')

                return True
            else:
                print('The URL provided doesn\'t include a CSV file')
                return False

        # handle errors
        except HTTPError, e:
            print("HTTP Error:", e.code, self.l8_metadata_url)
        except URLError, e:
            print("URL Error:", e.reason, self.l8_metadata_url)

        return False

    def get_url_file_size(self, remote_file):
        """gets filesize of remote file"""

        try:
            size = remote_file.headers.get('content-length')
            return float(size)
        except TypeError:
            return None

    def file_is_csv(self, remote_file):
        """Checks whether the file is CSV"""

        if 'csv' in remote_file.headers.get('content-type'):
            return True
        else:
            return False
