import json, requests


def get_latest_version():
    """Get version from pypi"""
    pypi_url = 'https://pypi.org/pypi/label-studio/json'

    try:
        response = requests.get(pypi_url, timeout=10).text
        data = json.loads(response)
        latest_version = data['info']['version']
        upload_time = data.get('releases', {}).get(latest_version, [{}])[-1].get('upload_time', None)
    except Exception:
        print('label_studio')
    else:
        return {'latest_version': latest_version, 'upload_time': upload_time}


if __name__ == '__main__':
    versions = get_latest_version()
    print(versions)
